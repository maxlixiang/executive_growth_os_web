create table public.growth_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null check (version > 0),
  status text not null default 'active' check (status in ('active', 'superseded', 'completed')),
  source text not null check (source in ('user', 'ai', 'migration')),
  long_term_goal text not null check (length(btrim(long_term_goal)) > 0),
  phase_goal text not null check (length(btrim(phase_goal)) > 0),
  focus_codes text[] not null check (cardinality(focus_codes) between 1 and 2),
  rationale text not null check (length(btrim(rationale)) > 0),
  milestones jsonb not null default '[]'::jsonb check (jsonb_typeof(milestones) = 'array'),
  confidence_score smallint not null check (confidence_score between 0 and 100),
  confidence_basis jsonb not null default '{}'::jsonb check (jsonb_typeof(confidence_basis) = 'object'),
  change_reason text,
  previous_plan_id uuid references public.growth_plans(id) on delete set null,
  starts_at date not null default current_date,
  target_ends_at date not null,
  ended_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, version),
  check (target_ends_at > starts_at),
  check (ended_at is null or ended_at >= starts_at)
);

create unique index growth_plans_one_active_idx
  on public.growth_plans(user_id) where status = 'active';
create index growth_plans_user_history_idx
  on public.growth_plans(user_id, version desc);

create trigger growth_plans_set_updated_at
  before update on public.growth_plans
  for each row execute function public.set_updated_at();

alter table public.growth_plans enable row level security;
create policy growth_plans_select_own on public.growth_plans
  for select to authenticated using ((select auth.uid()) = user_id);
create policy growth_plans_insert_own on public.growth_plans
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy growth_plans_update_own on public.growth_plans
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.growth_plans from anon;
grant select, insert, update on public.growth_plans to authenticated;

alter table public.monthly_reviews
  add column recommended_focus_codes jsonb not null default '[]'::jsonb
  check (jsonb_typeof(recommended_focus_codes) = 'array');

insert into public.growth_plans (
  user_id, version, source, long_term_goal, phase_goal, focus_codes,
  rationale, confidence_score, confidence_basis, target_ends_at
)
select
  state.user_id,
  1,
  'migration',
  state.overall_goal,
  coalesce(nullif(state.recent_training_direction, ''), '围绕当前重点能力建立知识基础，并通过真实工作形成可验证证据。'),
  array_agg(capability.code order by focus.priority),
  '由现有 Growth Profile 迁移。后续可由 AI 根据学习与实践数据重新评估。',
  20,
  jsonb_build_object('version', 1, 'note', '迁移时的初始快照；当前置信度会由应用根据实时数据重新计算。'),
  current_date + 56
from public.user_growth_state state
join public.user_focuses focus on focus.user_id = state.user_id and focus.is_active and focus.priority <= 2
join public.capabilities capability on capability.id = focus.capability_id
where nullif(btrim(state.overall_goal), '') is not null
group by state.user_id, state.overall_goal, state.recent_training_direction
on conflict do nothing;

create or replace function public.activate_growth_plan(
  p_long_term_goal text,
  p_phase_goal text,
  p_focus_codes text[],
  p_rationale text,
  p_milestones jsonb,
  p_confidence_score integer,
  p_confidence_basis jsonb,
  p_change_reason text,
  p_source text,
  p_target_ends_at date
)
returns public.growth_plans
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  current_plan public.growth_plans;
  saved public.growth_plans;
  capability record;
  next_version integer;
  position integer := 0;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if nullif(btrim(p_long_term_goal), '') is null then raise exception 'Long-term goal is required'; end if;
  if nullif(btrim(p_phase_goal), '') is null then raise exception 'Phase goal is required'; end if;
  if coalesce(array_length(p_focus_codes, 1), 0) not between 1 and 2 then
    raise exception 'One or two focus capabilities are required';
  end if;
  if (select count(*) from public.capabilities where code = any(p_focus_codes)) <> array_length(p_focus_codes, 1) then
    raise exception 'Invalid focus capability';
  end if;
  if p_source not in ('user', 'ai') then raise exception 'Invalid plan source'; end if;
  if p_confidence_score not between 0 and 100 then raise exception 'Invalid confidence score'; end if;
  if p_target_ends_at <= current_date then raise exception 'Target end date must be in the future'; end if;

  select * into current_plan from public.growth_plans
  where user_id = uid and status = 'active'
  for update;

  if current_plan.id is not null and nullif(btrim(p_change_reason), '') is null then
    raise exception 'A change reason is required when replacing an active plan';
  end if;

  select coalesce(max(version), 0) + 1 into next_version
  from public.growth_plans where user_id = uid;

  if current_plan.id is not null then
    update public.growth_plans
    set status = 'superseded', ended_at = current_date, updated_at = now()
    where id = current_plan.id;
  end if;

  insert into public.growth_plans (
    user_id, version, source, long_term_goal, phase_goal, focus_codes,
    rationale, milestones, confidence_score, confidence_basis,
    change_reason, previous_plan_id, target_ends_at
  ) values (
    uid, next_version, p_source, btrim(p_long_term_goal), btrim(p_phase_goal), p_focus_codes,
    btrim(p_rationale), coalesce(p_milestones, '[]'::jsonb), p_confidence_score,
    coalesce(p_confidence_basis, '{}'::jsonb), nullif(btrim(p_change_reason), ''),
    current_plan.id, p_target_ends_at
  ) returning * into saved;

  insert into public.user_growth_state (user_id, overall_goal, recent_training_direction)
  values (uid, btrim(p_long_term_goal), btrim(p_phase_goal))
  on conflict (user_id) do update set
    overall_goal = excluded.overall_goal,
    recent_training_direction = excluded.recent_training_direction,
    updated_at = now();

  update public.user_focuses
  set is_active = false, ends_at = current_date, updated_at = now()
  where user_id = uid and is_active;

  for capability in
    select id, code from public.capabilities
    where code = any(p_focus_codes)
    order by array_position(p_focus_codes, code)
  loop
    position := position + 1;
    insert into public.user_focuses (user_id, capability_id, priority, note, is_active, starts_at)
    values (uid, capability.id, position, 'Growth Plan v' || next_version, true, current_date);
  end loop;

  return saved;
end;
$$;

revoke execute on function public.activate_growth_plan(text, text, text[], text, jsonb, integer, jsonb, text, text, date) from public, anon;
grant execute on function public.activate_growth_plan(text, text, text[], text, jsonb, integer, jsonb, text, text, date) to authenticated;

create or replace function public.finalize_monthly_review(
  p_period_start date,
  p_period_end date,
  p_review_markdown text,
  p_recommended_concept_ids jsonb,
  p_recommended_practice_challenges jsonb,
  p_focus_codes text[],
  p_summary text,
  p_capability_assessments jsonb,
  p_strengths jsonb,
  p_weaknesses jsonb,
  p_knowledge_gaps jsonb,
  p_practice_gaps jsonb,
  p_recent_training_direction text
)
returns public.monthly_reviews
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  saved public.monthly_reviews;
begin
  if uid is null then raise exception 'Authentication required'; end if;

  insert into public.monthly_reviews (
    user_id, period_start, period_end, review_markdown,
    recommended_concept_ids, recommended_practice_challenges, recommended_focus_codes
  ) values (
    uid, p_period_start, p_period_end, p_review_markdown,
    p_recommended_concept_ids, p_recommended_practice_challenges, to_jsonb(p_focus_codes)
  )
  on conflict (user_id, period_start) do update set
    period_end = excluded.period_end,
    review_markdown = excluded.review_markdown,
    recommended_concept_ids = excluded.recommended_concept_ids,
    recommended_practice_challenges = excluded.recommended_practice_challenges,
    recommended_focus_codes = excluded.recommended_focus_codes,
    updated_at = now()
  returning * into saved;

  insert into public.user_growth_state (
    user_id, summary, capability_assessments, strengths, weaknesses,
    knowledge_gaps, practice_gaps, recent_training_direction
  ) values (
    uid, p_summary, p_capability_assessments, p_strengths, p_weaknesses,
    p_knowledge_gaps, p_practice_gaps, p_recent_training_direction
  )
  on conflict (user_id) do update set
    summary = excluded.summary,
    capability_assessments = excluded.capability_assessments,
    strengths = excluded.strengths,
    weaknesses = excluded.weaknesses,
    knowledge_gaps = excluded.knowledge_gaps,
    practice_gaps = excluded.practice_gaps,
    recent_training_direction = excluded.recent_training_direction,
    updated_at = now();

  return saved;
end;
$$;

create or replace function public.complete_quarterly_review(
  p_session_id uuid,
  p_assessment_markdown text,
  p_executive_level_gaps jsonb,
  p_next_quarter_focus text[],
  p_summary text,
  p_capability_assessments jsonb,
  p_strengths jsonb,
  p_weaknesses jsonb,
  p_knowledge_gaps jsonb,
  p_practice_gaps jsonb,
  p_recent_training_direction text
)
returns public.quarterly_reviews
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  session public.interview_sessions;
  saved public.quarterly_reviews;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  select * into session from public.interview_sessions
  where id = p_session_id and user_id = uid and status = 'active' for update;
  if session.id is null then raise exception 'Active interview not found'; end if;
  if (select count(*) from public.interview_messages where interview_session_id = session.id and user_id = uid and role = 'user') < 3 then
    raise exception 'Three interview answers are required';
  end if;

  update public.quarterly_reviews set
    assessment_markdown = p_assessment_markdown,
    executive_level_gaps = p_executive_level_gaps,
    next_quarter_focus = to_jsonb(p_next_quarter_focus),
    status = 'completed',
    updated_at = now()
  where id = session.quarterly_review_id and user_id = uid
  returning * into saved;

  update public.interview_sessions set status = 'completed', completed_at = now(), updated_at = now()
  where id = session.id and user_id = uid;

  insert into public.user_growth_state (
    user_id, summary, capability_assessments, strengths, weaknesses,
    knowledge_gaps, practice_gaps, recent_training_direction
  ) values (
    uid, p_summary, p_capability_assessments, p_strengths, p_weaknesses,
    p_knowledge_gaps, p_practice_gaps, p_recent_training_direction
  )
  on conflict (user_id) do update set
    summary = excluded.summary,
    capability_assessments = excluded.capability_assessments,
    strengths = excluded.strengths,
    weaknesses = excluded.weaknesses,
    knowledge_gaps = excluded.knowledge_gaps,
    practice_gaps = excluded.practice_gaps,
    recent_training_direction = excluded.recent_training_direction,
    updated_at = now();

  return saved;
end;
$$;
