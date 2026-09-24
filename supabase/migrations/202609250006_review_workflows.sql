create or replace function public.replace_active_focuses(p_user_id uuid, p_focus_codes text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  capability record;
  position integer := 0;
begin
  if p_user_id <> (select auth.uid()) then
    raise exception 'Not authorized';
  end if;
  if coalesce(array_length(p_focus_codes, 1), 0) = 0 then
    raise exception 'At least one focus is required';
  end if;

  update public.user_focuses
  set is_active = false, ends_at = current_date, updated_at = now()
  where user_id = p_user_id and is_active;

  for capability in
    select id, code from public.capabilities
    where code = any(p_focus_codes)
    order by array_position(p_focus_codes, code)
  loop
    position := position + 1;
    insert into public.user_focuses (user_id, capability_id, priority, is_active, starts_at)
    values (p_user_id, capability.id, position, true, current_date);
  end loop;
end;
$$;

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
    recommended_concept_ids, recommended_practice_challenges
  ) values (
    uid, p_period_start, p_period_end, p_review_markdown,
    p_recommended_concept_ids, p_recommended_practice_challenges
  )
  on conflict (user_id, period_start) do update set
    period_end = excluded.period_end,
    review_markdown = excluded.review_markdown,
    recommended_concept_ids = excluded.recommended_concept_ids,
    recommended_practice_challenges = excluded.recommended_practice_challenges,
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

  perform public.replace_active_focuses(uid, p_focus_codes);
  return saved;
end;
$$;

create or replace function public.start_quarterly_interview(
  p_period_start date,
  p_period_end date
)
returns public.interview_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  review public.quarterly_reviews;
  session public.interview_sessions;
begin
  if uid is null then raise exception 'Authentication required'; end if;

  insert into public.quarterly_reviews (user_id, period_start, period_end, status)
  values (uid, p_period_start, p_period_end, 'interviewing')
  on conflict (user_id, period_start) do nothing;

  select * into review from public.quarterly_reviews
  where user_id = uid and period_start = p_period_start;
  if review.status = 'completed' then raise exception 'Quarterly review already completed'; end if;

  select * into session from public.interview_sessions
  where user_id = uid and quarterly_review_id = review.id and status = 'active'
  order by started_at desc limit 1;

  if session.id is null then
    insert into public.interview_sessions (user_id, quarterly_review_id)
    values (uid, review.id) returning * into session;
  end if;
  return session;
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

  perform public.replace_active_focuses(uid, p_next_quarter_focus);
  return saved;
end;
$$;

revoke execute on function public.replace_active_focuses(uuid, text[]) from public, anon, authenticated;
revoke execute on function public.finalize_monthly_review(date, date, text, jsonb, jsonb, text[], text, jsonb, jsonb, jsonb, jsonb, jsonb, text) from public, anon;
revoke execute on function public.start_quarterly_interview(date, date) from public, anon;
revoke execute on function public.complete_quarterly_review(uuid, text, jsonb, text[], text, jsonb, jsonb, jsonb, jsonb, jsonb, text) from public, anon;
grant execute on function public.finalize_monthly_review(date, date, text, jsonb, jsonb, text[], text, jsonb, jsonb, jsonb, jsonb, jsonb, text) to authenticated;
grant execute on function public.start_quarterly_interview(date, date) to authenticated;
grant execute on function public.complete_quarterly_review(uuid, text, jsonb, text[], text, jsonb, jsonb, jsonb, jsonb, jsonb, text) to authenticated;
