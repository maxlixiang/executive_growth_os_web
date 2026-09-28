alter table public.assessment_sessions
  add column if not exists question_set jsonb not null default '[]'::jsonb check (jsonb_typeof(question_set) = 'array'),
  add column if not exists answer_set jsonb not null default '{}'::jsonb check (jsonb_typeof(answer_set) = 'object'),
  add column if not exists result_summary text,
  add column if not exists readiness_gates jsonb not null default '{}'::jsonb check (jsonb_typeof(readiness_gates) = 'object');

create unique index if not exists assessment_sessions_one_in_progress_idx
  on public.assessment_sessions(journey_id) where status = 'in_progress';

create or replace function public.start_initial_learning_journey(
  p_mode text,
  p_preparation_started_on date,
  p_long_term_goal text
)
returns public.learning_journeys
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  created public.learning_journeys;
  next_sequence integer;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if p_mode not in ('trial', 'official') then raise exception 'Invalid journey mode'; end if;
  if p_preparation_started_on is null or p_preparation_started_on > current_date then
    raise exception 'Preparation date cannot be in the future';
  end if;
  if exists (select 1 from public.learning_journeys where user_id = uid and status = 'active') then
    raise exception 'Active learning journey already exists';
  end if;

  perform pg_advisory_xact_lock(hashtext(uid::text));
  select coalesce(max(sequence_number), 0) + 1 into next_sequence
  from public.learning_journeys where user_id = uid;

  insert into public.learning_journeys (
    user_id, sequence_number, mode, status, stage, preparation_started_on
  ) values (
    uid, next_sequence, p_mode, 'active', 'preparation', p_preparation_started_on
  ) returning * into created;

  insert into public.user_growth_state (user_id, overall_goal)
  values (uid, nullif(btrim(p_long_term_goal), ''))
  on conflict (user_id) do update set
    overall_goal = excluded.overall_goal,
    capability_assessments = '{}'::jsonb,
    strengths = '[]'::jsonb,
    weaknesses = '[]'::jsonb,
    knowledge_gaps = '[]'::jsonb,
    practice_gaps = '[]'::jsonb,
    recent_training_direction = null,
    summary = null,
    updated_at = now();

  insert into public.activity_events (user_id, journey_id, event_type, title, summary, metadata)
  values (
    uid,
    created.id,
    'journey_started',
    case when p_mode = 'trial' then '开始试用旅程' else '开始正式旅程的基础预学习' end,
    case when p_mode = 'trial'
      then '试用数据会保留，但不会自动带入之后的正式旅程。'
      else '正式评分将在完成基础预学习和基线诊断后建立。'
    end,
    jsonb_build_object('preparation_started_on', p_preparation_started_on, 'mode', p_mode)
  );
  return created;
end;
$$;

create or replace function public.start_assessment_session(
  p_assessment_type text,
  p_question_set jsonb
)
returns public.assessment_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  journey public.learning_journeys;
  cycle public.learning_cycles;
  session public.assessment_sessions;
  foundation_total integer;
  foundation_completed integer;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if p_assessment_type not in ('baseline', 'formal', 'self_check') then raise exception 'Invalid assessment type'; end if;
  if jsonb_typeof(p_question_set) <> 'array' or jsonb_array_length(p_question_set) <> 6 then
    raise exception 'Six capability questions are required';
  end if;

  perform pg_advisory_xact_lock(hashtext(uid::text));
  select * into journey from public.learning_journeys
  where user_id = uid and status = 'active' for update;
  if journey.id is null then raise exception 'Active learning journey required'; end if;
  if exists (select 1 from public.assessment_sessions where journey_id = journey.id and status = 'in_progress') then
    raise exception 'An assessment is already in progress';
  end if;

  if p_assessment_type = 'baseline' then
    if journey.baseline_completed_on is not null then raise exception 'Baseline assessment already completed'; end if;
    with ranked as (
      select id, row_number() over (partition by capability_id order by sort_order, id) as position
      from public.knowledge_concepts where is_active
    ), foundation as (select id from ranked where position <= 4)
    select count(*), count(*) filter (where kp.status in ('understood', 'applied', 'verified'))
    into foundation_total, foundation_completed
    from foundation f left join public.knowledge_progress kp on kp.concept_id = f.id and kp.user_id = uid;
    if foundation_total = 0 or foundation_completed < foundation_total then
      raise exception 'Foundation learning is incomplete';
    end if;
  else
    if journey.stage <> 'active' or journey.formal_started_on is null then raise exception 'Formal learning has not started'; end if;
    select * into cycle from public.learning_cycles
    where journey_id = journey.id and status = 'current' for update;
    if cycle.id is null then raise exception 'Current cycle not found'; end if;
    if p_assessment_type = 'formal' and cycle.assessment_due_on > current_date then
      raise exception 'Formal assessment is not due yet';
    end if;
  end if;

  insert into public.assessment_sessions (
    user_id, journey_id, cycle_id, assessment_type, status, started_at, question_set
  ) values (
    uid, journey.id, cycle.id, p_assessment_type, 'in_progress', now(), p_question_set
  ) returning * into session;

  insert into public.activity_events (
    user_id, journey_id, cycle_id, event_type, title, source_type, source_id
  ) values (
    uid, journey.id, cycle.id, 'assessment_started',
    case p_assessment_type when 'baseline' then '开始基线诊断' when 'formal' then '开始双月正式评估' else '开始自主评估' end,
    'assessment_session', session.id
  );
  return session;
end;
$$;

create or replace function public.complete_assessment_session(
  p_session_id uuid,
  p_answer_set jsonb,
  p_scores jsonb,
  p_confidence_score integer,
  p_result_summary text
)
returns public.assessment_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  session public.assessment_sessions;
  journey public.learning_journeys;
  cycle public.learning_cycles;
  next_cycle public.learning_cycles;
  readiness numeric(5,2);
  min_capability numeric;
  knowledge_ok boolean;
  practice_ok boolean;
  gates jsonb;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_answer_set) <> 'object' or jsonb_typeof(p_scores) <> 'array' or jsonb_array_length(p_scores) <> 6 then
    raise exception 'Invalid assessment result';
  end if;
  if p_confidence_score not between 0 and 100 or nullif(btrim(p_result_summary), '') is null then
    raise exception 'Invalid confidence or summary';
  end if;

  perform pg_advisory_xact_lock(hashtext(uid::text));
  select * into session from public.assessment_sessions
  where id = p_session_id and user_id = uid and status = 'in_progress' for update;
  if session.id is null then raise exception 'Assessment session is unavailable'; end if;
  select * into journey from public.learning_journeys
  where id = session.journey_id and user_id = uid and status = 'active' for update;
  if journey.id is null then raise exception 'Assessment journey is no longer active'; end if;

  if (select count(distinct item->>'code') from jsonb_array_elements(p_scores) item) <> 6
     or exists (
       select 1 from jsonb_array_elements(p_scores) item
       where (item->>'knowledge_score')::numeric not between 0 and 30
          or (item->>'case_score')::numeric not between 0 and 30
          or (item->>'practice_score')::numeric not between 0 and 40
          or item->>'evidence_level' not in ('E0','E1','E2','E3','E4','E5')
     ) then raise exception 'Capability scores are invalid';
  end if;

  insert into public.assessment_capability_scores (
    user_id, assessment_session_id, capability_id, knowledge_score, case_score,
    practice_score, evidence_level, rationale, evidence_refs
  )
  select
    uid, session.id, c.id,
    (item->>'knowledge_score')::numeric,
    (item->>'case_score')::numeric,
    (item->>'practice_score')::numeric,
    item->>'evidence_level',
    item->>'rationale',
    coalesce(item->'evidence_refs', '[]'::jsonb)
  from jsonb_array_elements(p_scores) item
  join public.capabilities c on c.code = item->>'code' and c.is_active;

  if (select count(*) from public.assessment_capability_scores where assessment_session_id = session.id) <> 6 then
    raise exception 'All six capabilities are required';
  end if;

  select
    round(sum(s.capability_score * case c.code
      when 'business' then 18 when 'finance' then 15 when 'strategy' then 18
      when 'execution' then 18 when 'leadership' then 16 when 'influence' then 15 else 0 end) / 100, 2),
    min(s.capability_score), bool_and(s.knowledge_score >= 18), bool_and(s.practice_score >= 16)
  into readiness, min_capability, knowledge_ok, practice_ok
  from public.assessment_capability_scores s
  join public.capabilities c on c.id = s.capability_id
  where s.assessment_session_id = session.id;

  gates := jsonb_build_object(
    'overall', readiness >= 70,
    'capabilityFloor', min_capability >= 55,
    'knowledgeFloor', knowledge_ok,
    'practiceFloor', practice_ok,
    'ready', readiness >= 70 and min_capability >= 55 and knowledge_ok and practice_ok
  );

  update public.assessment_sessions set
    status = 'completed', answer_set = p_answer_set, result_summary = btrim(p_result_summary),
    readiness_score = readiness, confidence_score = p_confidence_score,
    readiness_gates = gates, completed_at = now()
  where id = session.id returning * into session;

  if session.assessment_type = 'baseline' then
    update public.learning_journeys set baseline_completed_on = current_date, stage = 'baseline_pending'
    where id = journey.id;
  elsif session.assessment_type = 'formal' then
    select * into cycle from public.learning_cycles
    where id = session.cycle_id and journey_id = journey.id and status = 'current' for update;
    if cycle.id is null then raise exception 'Current cycle changed before assessment completion'; end if;
    update public.learning_cycles set status = 'completed', completed_at = now() where id = cycle.id;
    insert into public.learning_cycles (
      user_id, journey_id, cycle_number, starts_on, ends_on, assessment_due_on
    ) values (
      uid, journey.id, cycle.cycle_number + 1, current_date,
      (current_date + interval '2 months' - interval '1 day')::date,
      (current_date + interval '2 months')::date
    ) returning * into next_cycle;
  end if;

  insert into public.user_growth_state (user_id, summary, capability_assessments)
  values (
    uid, btrim(p_result_summary),
    (select jsonb_object_agg(c.code, jsonb_build_object(
      'knowledge', s.knowledge_score, 'case', s.case_score, 'practice', s.practice_score,
      'total', s.capability_score, 'evidence_level', s.evidence_level, 'rationale', s.rationale
    )) from public.assessment_capability_scores s join public.capabilities c on c.id = s.capability_id
      where s.assessment_session_id = session.id)
  ) on conflict (user_id) do update set
    summary = excluded.summary, capability_assessments = excluded.capability_assessments, updated_at = now();

  insert into public.activity_events (
    user_id, journey_id, cycle_id, event_type, title, summary, source_type, source_id, metadata
  ) values (
    uid, journey.id, session.cycle_id, 'assessment_completed',
    case session.assessment_type when 'baseline' then '完成基线诊断' when 'formal' then '完成双月正式评估' else '完成自主评估' end,
    '综合评分 ' || readiness || ' / 100；置信度 ' || p_confidence_score || '%。',
    'assessment_session', session.id,
    jsonb_build_object('assessment_type', session.assessment_type, 'readiness_score', readiness, 'gates', gates, 'next_cycle_id', next_cycle.id)
  );
  return session;
end;
$$;

create or replace function public.confirm_formal_learning_start(p_date date)
returns public.learning_cycles
language plpgsql
security definer
set search_path = ''
as $$
declare uid uuid := (select auth.uid()); journey public.learning_journeys; cycle public.learning_cycles;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  perform pg_advisory_xact_lock(hashtext(uid::text));
  select * into journey from public.learning_journeys where user_id = uid and status = 'active' for update;
  if journey.id is null or journey.mode <> 'official' then raise exception 'Official journey required'; end if;
  if journey.baseline_completed_on is null then raise exception 'Baseline assessment must be completed first'; end if;
  if journey.formal_started_on is not null then raise exception 'Formal learning already started'; end if;
  if p_date < journey.baseline_completed_on or p_date > current_date then
    raise exception 'Formal start date must be between baseline completion and today';
  end if;
  update public.learning_journeys set formal_started_on = p_date, stage = 'active' where id = journey.id;
  insert into public.learning_cycles (user_id, journey_id, cycle_number, starts_on, ends_on, assessment_due_on)
  values (uid, journey.id, 1, p_date, (p_date + interval '2 months' - interval '1 day')::date, (p_date + interval '2 months')::date)
  returning * into cycle;
  insert into public.activity_events (user_id, journey_id, cycle_id, event_type, title, summary, metadata)
  values (uid, journey.id, cycle.id, 'formal_learning_started', '正式学习第1周期开始', '双月评估以本日期为固定锚点。', jsonb_build_object('formal_started_on', p_date, 'assessment_due_on', cycle.assessment_due_on));
  return cycle;
end;
$$;

revoke execute on function public.start_initial_learning_journey(text, date, text) from public, anon;
revoke execute on function public.start_assessment_session(text, jsonb) from public, anon;
revoke execute on function public.complete_assessment_session(uuid, jsonb, jsonb, integer, text) from public, anon;
grant execute on function public.start_initial_learning_journey(text, date, text) to authenticated;
grant execute on function public.start_assessment_session(text, jsonb) to authenticated;
grant execute on function public.complete_assessment_session(uuid, jsonb, jsonb, integer, text) to authenticated;

drop policy if exists learning_journeys_insert_own on public.learning_journeys;
drop policy if exists learning_journeys_update_own on public.learning_journeys;
drop policy if exists learning_cycles_insert_own on public.learning_cycles;
drop policy if exists learning_cycles_update_own on public.learning_cycles;
drop policy if exists assessment_sessions_insert_own on public.assessment_sessions;
drop policy if exists assessment_sessions_update_own on public.assessment_sessions;
drop policy if exists assessment_capability_scores_insert_own on public.assessment_capability_scores;
drop policy if exists assessment_capability_scores_update_own on public.assessment_capability_scores;

revoke insert, update, delete on public.learning_journeys, public.learning_cycles,
  public.assessment_sessions, public.assessment_capability_scores from authenticated;
grant select on public.learning_journeys, public.learning_cycles,
  public.assessment_sessions, public.assessment_capability_scores to authenticated;
