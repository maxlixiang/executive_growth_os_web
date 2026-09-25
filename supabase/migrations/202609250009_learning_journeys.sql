create table public.learning_journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sequence_number integer not null check (sequence_number > 0),
  mode text not null check (mode in ('trial', 'official')),
  status text not null default 'active' check (status in ('active', 'archived')),
  stage text not null default 'preparation' check (stage in ('preparation', 'baseline_pending', 'active')),
  preparation_started_on date not null,
  baseline_completed_on date,
  formal_started_on date,
  archived_at timestamptz,
  restart_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, sequence_number),
  unique (id, user_id),
  check (status = 'active' or archived_at is not null),
  check (stage <> 'active' or formal_started_on is not null)
);

create unique index learning_journeys_one_active_idx
  on public.learning_journeys(user_id) where status = 'active';
create index learning_journeys_user_history_idx
  on public.learning_journeys(user_id, sequence_number desc);

create table public.learning_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_id uuid not null,
  cycle_number integer not null check (cycle_number > 0),
  starts_on date not null,
  ends_on date not null,
  assessment_due_on date not null,
  status text not null default 'current' check (status in ('current', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (journey_id, cycle_number),
  unique (id, user_id),
  foreign key (journey_id, user_id) references public.learning_journeys(id, user_id) on delete cascade,
  check (ends_on >= starts_on),
  check (assessment_due_on > starts_on)
);

create unique index learning_cycles_one_current_idx
  on public.learning_cycles(journey_id) where status = 'current';
create index learning_cycles_user_journey_idx
  on public.learning_cycles(user_id, journey_id, cycle_number desc);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_id uuid,
  cycle_id uuid,
  event_type text not null,
  title text not null,
  summary text,
  source_type text,
  source_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (journey_id, user_id) references public.learning_journeys(id, user_id) on delete cascade,
  foreign key (cycle_id) references public.learning_cycles(id) on delete set null
);

create index activity_events_user_time_idx on public.activity_events(user_id, occurred_at desc);
create index activity_events_journey_time_idx on public.activity_events(user_id, journey_id, occurred_at desc);

create table public.assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_id uuid not null,
  cycle_id uuid,
  assessment_type text not null check (assessment_type in ('baseline', 'formal', 'self_check')),
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed', 'cancelled')),
  scoring_version integer not null default 1,
  readiness_score numeric(5,2) check (readiness_score between 0 and 100),
  confidence_score smallint check (confidence_score between 0 and 100),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (journey_id, user_id) references public.learning_journeys(id, user_id) on delete cascade,
  foreign key (cycle_id) references public.learning_cycles(id) on delete set null
);

create table public.assessment_capability_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_session_id uuid not null,
  capability_id uuid not null references public.capabilities(id) on delete restrict,
  knowledge_score numeric(5,2) not null check (knowledge_score between 0 and 30),
  case_score numeric(5,2) not null check (case_score between 0 and 30),
  practice_score numeric(5,2) not null check (practice_score between 0 and 40),
  capability_score numeric(5,2) generated always as (knowledge_score + case_score + practice_score) stored,
  evidence_level text not null default 'E0' check (evidence_level in ('E0', 'E1', 'E2', 'E3', 'E4', 'E5')),
  rationale text not null,
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs) = 'array'),
  created_at timestamptz not null default now(),
  unique (assessment_session_id, capability_id),
  foreign key (assessment_session_id, user_id) references public.assessment_sessions(id, user_id) on delete cascade
);

do $$
declare table_name text;
begin
  foreach table_name in array array['learning_journeys', 'learning_cycles', 'activity_events', 'assessment_sessions', 'assessment_capability_scores']
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', table_name || '_insert_own', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name || '_update_own', table_name);
  end loop;
end;
$$;

create trigger learning_journeys_set_updated_at before update on public.learning_journeys
for each row execute function public.set_updated_at();
create trigger learning_cycles_set_updated_at before update on public.learning_cycles
for each row execute function public.set_updated_at();
create trigger assessment_sessions_set_updated_at before update on public.assessment_sessions
for each row execute function public.set_updated_at();

insert into public.learning_journeys (user_id, sequence_number, mode, status, stage, preparation_started_on)
select id, 1, 'trial', 'active', 'preparation', current_date
from public.profiles
on conflict do nothing;

insert into public.activity_events (user_id, journey_id, event_type, title, summary, occurred_at)
select user_id, id, 'journey_started', '开始试用旅程', '现有数据已归入试用旅程；正式学习尚未开始。', created_at
from public.learning_journeys
where sequence_number = 1
on conflict do nothing;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'capture_entries', 'daily_reflections', 'daily_capability_tags', 'growth_gaps',
    'practice_evidence', 'study_attempts', 'study_sessions', 'monthly_reviews',
    'quarterly_reviews', 'interview_sessions', 'interview_messages', 'ai_runs', 'growth_plans'
  ] loop
    execute format('alter table public.%I add column journey_id uuid', table_name);
    execute format(
      'update public.%I item set journey_id = journey.id from public.learning_journeys journey where journey.user_id = item.user_id and journey.status = ''active''',
      table_name
    );
    execute format('alter table public.%I alter column journey_id set not null', table_name);
    execute format(
      'alter table public.%I add constraint %I foreign key (journey_id, user_id) references public.learning_journeys(id, user_id) on delete cascade',
      table_name, table_name || '_journey_user_fkey'
    );
    execute format('create index %I on public.%I(user_id, journey_id)', table_name || '_user_journey_idx', table_name);
  end loop;
end;
$$;

alter table public.monthly_reviews drop constraint monthly_reviews_user_id_period_start_key;
alter table public.monthly_reviews add unique (user_id, journey_id, period_start);
alter table public.quarterly_reviews drop constraint quarterly_reviews_user_id_period_start_key;
alter table public.quarterly_reviews add unique (user_id, journey_id, period_start);

create or replace function public.assign_active_learning_journey()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.journey_id is null then
    select id into new.journey_id from public.learning_journeys
    where user_id = new.user_id and status = 'active';
  end if;
  if new.journey_id is null then raise exception 'Active learning journey required'; end if;
  if not exists (select 1 from public.learning_journeys where id = new.journey_id and user_id = new.user_id and status = 'active') then
    raise exception 'Journey is not active for this user';
  end if;
  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'capture_entries', 'daily_reflections', 'daily_capability_tags', 'growth_gaps',
    'practice_evidence', 'study_attempts', 'study_sessions', 'monthly_reviews',
    'quarterly_reviews', 'interview_sessions', 'interview_messages', 'ai_runs', 'growth_plans'
  ] loop
    execute format('create trigger %I before insert on public.%I for each row execute function public.assign_active_learning_journey()', table_name || '_assign_journey', table_name);
  end loop;
end;
$$;

create or replace function public.restart_learning_journey(
  p_mode text,
  p_preparation_started_on date,
  p_reason text,
  p_copy_long_term_goal boolean,
  p_confirmation text
)
returns public.learning_journeys
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  prior public.learning_journeys;
  created public.learning_journeys;
  next_sequence integer;
  prior_goal text;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if p_mode not in ('trial', 'official') then raise exception 'Invalid journey mode'; end if;
  if nullif(btrim(p_reason), '') is null or length(btrim(p_reason)) < 5 then raise exception 'Restart reason is required'; end if;
  if p_confirmation <> '重新开始学习旅程' then raise exception 'Confirmation text does not match'; end if;

  select * into prior from public.learning_journeys where user_id = uid and status = 'active' for update;
  select overall_goal into prior_goal from public.user_growth_state where user_id = uid;
  select coalesce(max(sequence_number), 0) + 1 into next_sequence from public.learning_journeys where user_id = uid;

  if prior.id is not null then
    update public.learning_journeys set status = 'archived', archived_at = now(), restart_reason = btrim(p_reason) where id = prior.id;
    update public.learning_cycles set status = 'completed', completed_at = now() where journey_id = prior.id and status = 'current';
    update public.growth_plans set status = 'superseded', ended_at = current_date where user_id = uid and journey_id = prior.id and status = 'active';
    insert into public.activity_events (user_id, journey_id, event_type, title, summary)
    values (uid, prior.id, 'journey_archived', '学习旅程已归档', btrim(p_reason));
  end if;

  insert into public.learning_journeys (user_id, sequence_number, mode, preparation_started_on)
  values (uid, next_sequence, p_mode, p_preparation_started_on)
  returning * into created;

  delete from public.knowledge_progress where user_id = uid;
  update public.user_focuses set is_active = false, ends_at = current_date, updated_at = now() where user_id = uid and is_active;
  insert into public.user_growth_state (user_id, overall_goal)
  values (uid, case when p_copy_long_term_goal then prior_goal else null end)
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
    uid, created.id, 'journey_started',
    case when p_mode = 'trial' then '开始试用旅程' else '开始正式旅程的预学习' end,
    '旧旅程数据已归档，不参与当前 AI 判断与评分。',
    jsonb_build_object('preparation_started_on', p_preparation_started_on, 'copied_long_term_goal', p_copy_long_term_goal)
  );
  return created;
end;
$$;

create or replace function public.correct_journey_preparation_date(p_date date, p_reason text)
returns public.learning_journeys
language plpgsql
security definer
set search_path = ''
as $$
declare uid uuid := (select auth.uid()); journey public.learning_journeys; old_date date;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if nullif(btrim(p_reason), '') is null or length(btrim(p_reason)) < 5 then raise exception 'Correction reason is required'; end if;
  select * into journey from public.learning_journeys where user_id = uid and status = 'active' for update;
  if journey.id is null then raise exception 'Active journey not found'; end if;
  if journey.baseline_completed_on is not null then raise exception 'Restart the journey after baseline assessment'; end if;
  old_date := journey.preparation_started_on;
  update public.learning_journeys set preparation_started_on = p_date where id = journey.id returning * into journey;
  insert into public.activity_events (user_id, journey_id, event_type, title, summary, metadata)
  values (uid, journey.id, 'journey_date_corrected', '更正预学习开始日期', btrim(p_reason), jsonb_build_object('from', old_date, 'to', p_date));
  return journey;
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
  select * into journey from public.learning_journeys where user_id = uid and status = 'active' for update;
  if journey.id is null or journey.mode <> 'official' then raise exception 'Official journey required'; end if;
  if journey.baseline_completed_on is null then raise exception 'Baseline assessment must be completed first'; end if;
  if journey.formal_started_on is not null then raise exception 'Formal learning already started'; end if;
  update public.learning_journeys set formal_started_on = p_date, stage = 'active' where id = journey.id;
  insert into public.learning_cycles (user_id, journey_id, cycle_number, starts_on, ends_on, assessment_due_on)
  values (uid, journey.id, 1, p_date, (p_date + interval '2 months' - interval '1 day')::date, (p_date + interval '2 months')::date)
  returning * into cycle;
  insert into public.activity_events (user_id, journey_id, cycle_id, event_type, title, summary, metadata)
  values (uid, journey.id, cycle.id, 'formal_learning_started', '正式学习第1周期开始', '双月评估以本日期为固定锚点。', jsonb_build_object('formal_started_on', p_date, 'assessment_due_on', cycle.assessment_due_on));
  return cycle;
end;
$$;

revoke execute on function public.restart_learning_journey(text, date, text, boolean, text) from public, anon;
revoke execute on function public.correct_journey_preparation_date(date, text) from public, anon;
revoke execute on function public.confirm_formal_learning_start(date) from public, anon;
grant execute on function public.restart_learning_journey(text, date, text, boolean, text) to authenticated;
grant execute on function public.correct_journey_preparation_date(date, text) to authenticated;
grant execute on function public.confirm_formal_learning_start(date) to authenticated;

drop policy activity_events_update_own on public.activity_events;
grant select, insert, update on public.learning_journeys, public.learning_cycles, public.assessment_sessions, public.assessment_capability_scores to authenticated;
grant select, insert on public.activity_events to authenticated;
revoke all on public.learning_journeys, public.learning_cycles, public.activity_events, public.assessment_sessions, public.assessment_capability_scores from anon;

create or replace function public.rebuild_knowledge_progress(p_user_id uuid, p_concept_id uuid)
returns public.knowledge_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_journey uuid;
  item record;
  session_count integer := 0;
  streak integer := 0;
  first_learned date;
  reviewed_on date;
  next_review date;
  result_status text;
  result public.knowledge_progress;
begin
  if (select auth.uid()) is null or (select auth.uid()) <> p_user_id then raise exception 'Not authorized'; end if;
  select id into active_journey from public.learning_journeys where user_id = p_user_id and status = 'active';
  for item in
    select concept_score, application_score, committed_at
    from public.study_sessions
    where user_id = p_user_id and journey_id = active_journey and concept_id = p_concept_id and is_valid
    order by committed_at, id
  loop
    session_count := session_count + 1;
    reviewed_on := item.committed_at::date;
    first_learned := coalesce(first_learned, reviewed_on);
    if item.concept_score >= 2 and item.application_score >= 2 then streak := streak + 1; else streak := 0; end if;
    if item.concept_score = 3 and item.application_score = 3 then result_status := 'verified';
    elsif item.concept_score >= 2 and item.application_score >= 2 then result_status := 'applied';
    else result_status := 'needs_review'; end if;
    if item.concept_score <= 1 then next_review := reviewed_on + 1;
    elsif item.application_score <= 1 then next_review := reviewed_on + 3;
    elsif item.application_score = 2 then next_review := reviewed_on + 7;
    else next_review := reviewed_on + case least(streak, 3) when 0 then 14 when 1 then 30 when 2 then 60 else 90 end;
    end if;
  end loop;
  if session_count = 0 then
    delete from public.knowledge_progress where user_id = p_user_id and concept_id = p_concept_id;
    return null;
  end if;
  insert into public.knowledge_progress (
    user_id, concept_id, status, first_learned_at, last_reviewed_at, next_review_at,
    review_count, consecutive_successes, last_concept_score, last_application_score
  ) values (
    p_user_id, p_concept_id, result_status, first_learned, reviewed_on, next_review,
    session_count, streak, item.concept_score, item.application_score
  ) on conflict (user_id, concept_id) do update set
    status = excluded.status, first_learned_at = excluded.first_learned_at,
    last_reviewed_at = excluded.last_reviewed_at, next_review_at = excluded.next_review_at,
    review_count = excluded.review_count, consecutive_successes = excluded.consecutive_successes,
    last_concept_score = excluded.last_concept_score, last_application_score = excluded.last_application_score,
    updated_at = now()
  returning * into result;
  return result;
end;
$$;

create or replace function public.activate_growth_plan(
  p_long_term_goal text, p_phase_goal text, p_focus_codes text[], p_rationale text,
  p_milestones jsonb, p_confidence_score integer, p_confidence_basis jsonb,
  p_change_reason text, p_source text, p_target_ends_at date
)
returns public.growth_plans
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  jid uuid;
  current_plan public.growth_plans;
  saved public.growth_plans;
  capability record;
  next_version integer;
  position integer := 0;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  select id into jid from public.learning_journeys where user_id = uid and status = 'active';
  if jid is null then raise exception 'Active learning journey required'; end if;
  if nullif(btrim(p_long_term_goal), '') is null or nullif(btrim(p_phase_goal), '') is null then raise exception 'Goals are required'; end if;
  if coalesce(array_length(p_focus_codes, 1), 0) not between 1 and 2 then raise exception 'One or two focus capabilities are required'; end if;
  if (select count(*) from public.capabilities where code = any(p_focus_codes)) <> array_length(p_focus_codes, 1) then raise exception 'Invalid focus capability'; end if;
  if p_source not in ('user', 'ai') or p_confidence_score not between 0 and 100 or p_target_ends_at <= current_date then raise exception 'Invalid plan'; end if;

  select * into current_plan from public.growth_plans
  where user_id = uid and journey_id = jid and status = 'active' for update;
  if current_plan.id is not null and nullif(btrim(p_change_reason), '') is null then raise exception 'A change reason is required when replacing an active plan'; end if;
  select coalesce(max(version), 0) + 1 into next_version from public.growth_plans where user_id = uid;
  if current_plan.id is not null then
    update public.growth_plans set status = 'superseded', ended_at = current_date, updated_at = now() where id = current_plan.id;
  end if;
  insert into public.growth_plans (
    user_id, journey_id, version, source, long_term_goal, phase_goal, focus_codes,
    rationale, milestones, confidence_score, confidence_basis, change_reason,
    previous_plan_id, target_ends_at
  ) values (
    uid, jid, next_version, p_source, btrim(p_long_term_goal), btrim(p_phase_goal), p_focus_codes,
    btrim(p_rationale), coalesce(p_milestones, '[]'::jsonb), p_confidence_score,
    coalesce(p_confidence_basis, '{}'::jsonb), nullif(btrim(p_change_reason), ''),
    current_plan.id, p_target_ends_at
  ) returning * into saved;
  insert into public.user_growth_state (user_id, overall_goal, recent_training_direction)
  values (uid, btrim(p_long_term_goal), btrim(p_phase_goal))
  on conflict (user_id) do update set overall_goal = excluded.overall_goal,
    recent_training_direction = excluded.recent_training_direction, updated_at = now();
  update public.user_focuses set is_active = false, ends_at = current_date, updated_at = now() where user_id = uid and is_active;
  for capability in select id, code from public.capabilities where code = any(p_focus_codes) order by array_position(p_focus_codes, code)
  loop
    position := position + 1;
    insert into public.user_focuses (user_id, capability_id, priority, note, is_active, starts_at)
    values (uid, capability.id, position, 'Growth Plan v' || next_version, true, current_date);
  end loop;
  insert into public.activity_events (user_id, journey_id, event_type, title, summary, source_type, source_id)
  values (uid, jid, 'growth_plan_activated', '启用成长计划 v' || next_version, btrim(p_phase_goal), 'growth_plan', saved.id);
  return saved;
end;
$$;

create or replace function public.finalize_monthly_review(
  p_period_start date, p_period_end date, p_review_markdown text,
  p_recommended_concept_ids jsonb, p_recommended_practice_challenges jsonb,
  p_focus_codes text[], p_summary text, p_capability_assessments jsonb,
  p_strengths jsonb, p_weaknesses jsonb, p_knowledge_gaps jsonb,
  p_practice_gaps jsonb, p_recent_training_direction text
)
returns public.monthly_reviews
language plpgsql
security definer
set search_path = ''
as $$
declare uid uuid := (select auth.uid()); jid uuid; saved public.monthly_reviews;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  select id into jid from public.learning_journeys where user_id = uid and status = 'active';
  if jid is null then raise exception 'Active learning journey required'; end if;
  insert into public.monthly_reviews (
    user_id, journey_id, period_start, period_end, review_markdown,
    recommended_concept_ids, recommended_practice_challenges, recommended_focus_codes
  ) values (
    uid, jid, p_period_start, p_period_end, p_review_markdown,
    p_recommended_concept_ids, p_recommended_practice_challenges, to_jsonb(p_focus_codes)
  ) on conflict (user_id, journey_id, period_start) do update set
    period_end = excluded.period_end, review_markdown = excluded.review_markdown,
    recommended_concept_ids = excluded.recommended_concept_ids,
    recommended_practice_challenges = excluded.recommended_practice_challenges,
    recommended_focus_codes = excluded.recommended_focus_codes, updated_at = now()
  returning * into saved;
  insert into public.user_growth_state (
    user_id, summary, capability_assessments, strengths, weaknesses,
    knowledge_gaps, practice_gaps, recent_training_direction
  ) values (
    uid, p_summary, p_capability_assessments, p_strengths, p_weaknesses,
    p_knowledge_gaps, p_practice_gaps, p_recent_training_direction
  ) on conflict (user_id) do update set
    summary = excluded.summary, capability_assessments = excluded.capability_assessments,
    strengths = excluded.strengths, weaknesses = excluded.weaknesses,
    knowledge_gaps = excluded.knowledge_gaps, practice_gaps = excluded.practice_gaps,
    recent_training_direction = excluded.recent_training_direction, updated_at = now();
  insert into public.activity_events (user_id, journey_id, event_type, title, summary, source_type, source_id)
  values (uid, jid, 'monthly_review_completed', '完成月度复盘', p_period_start || ' — ' || p_period_end, 'monthly_review', saved.id);
  return saved;
end;
$$;

create or replace function public.start_quarterly_interview(p_period_start date, p_period_end date)
returns public.interview_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare uid uuid := (select auth.uid()); jid uuid; review public.quarterly_reviews; session public.interview_sessions;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  select id into jid from public.learning_journeys where user_id = uid and status = 'active';
  if jid is null then raise exception 'Active learning journey required'; end if;
  insert into public.quarterly_reviews (user_id, journey_id, period_start, period_end, status)
  values (uid, jid, p_period_start, p_period_end, 'interviewing')
  on conflict (user_id, journey_id, period_start) do nothing;
  select * into review from public.quarterly_reviews where user_id = uid and journey_id = jid and period_start = p_period_start;
  if review.status = 'completed' then raise exception 'Quarterly review already completed'; end if;
  select * into session from public.interview_sessions
  where user_id = uid and journey_id = jid and quarterly_review_id = review.id and status = 'active'
  order by started_at desc limit 1;
  if session.id is null then
    insert into public.interview_sessions (user_id, journey_id, quarterly_review_id)
    values (uid, jid, review.id) returning * into session;
  end if;
  return session;
end;
$$;


