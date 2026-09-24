create unique index study_sessions_attempt_id_unique_idx
  on public.study_sessions (attempt_id)
  where attempt_id is not null;

create or replace function public.rebuild_knowledge_progress(
  p_user_id uuid,
  p_concept_id uuid
)
returns public.knowledge_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  item record;
  session_count integer := 0;
  streak integer := 0;
  first_learned date;
  reviewed_on date;
  next_review date;
  result_status text;
  result public.knowledge_progress;
begin
  if (select auth.uid()) is null or (select auth.uid()) <> p_user_id then
    raise exception 'Not authorized to rebuild this progress record';
  end if;

  for item in
    select concept_score, application_score, committed_at
    from public.study_sessions
    where user_id = p_user_id
      and concept_id = p_concept_id
      and is_valid
    order by committed_at, id
  loop
    session_count := session_count + 1;
    reviewed_on := item.committed_at::date;
    first_learned := coalesce(first_learned, reviewed_on);

    if item.concept_score >= 2 and item.application_score >= 2 then
      streak := streak + 1;
    else
      streak := 0;
    end if;

    if item.concept_score = 3 and item.application_score = 3 then
      result_status := 'verified';
    elsif item.concept_score >= 2 and item.application_score >= 2 then
      result_status := 'applied';
    else
      result_status := 'needs_review';
    end if;

    if item.concept_score <= 1 then
      next_review := reviewed_on + 1;
    elsif item.application_score <= 1 then
      next_review := reviewed_on + 3;
    elsif item.application_score = 2 then
      next_review := reviewed_on + 7;
    else
      next_review := reviewed_on + case least(streak, 3)
        when 0 then 14
        when 1 then 30
        when 2 then 60
        else 90
      end;
    end if;
  end loop;

  if session_count = 0 then
    delete from public.knowledge_progress
    where user_id = p_user_id and concept_id = p_concept_id;
    return null;
  end if;

  insert into public.knowledge_progress (
    user_id, concept_id, status, first_learned_at, last_reviewed_at,
    next_review_at, review_count, consecutive_successes,
    last_concept_score, last_application_score
  )
  values (
    p_user_id, p_concept_id, result_status, first_learned, reviewed_on,
    next_review, session_count, streak, item.concept_score, item.application_score
  )
  on conflict (user_id, concept_id) do update set
    status = excluded.status,
    first_learned_at = excluded.first_learned_at,
    last_reviewed_at = excluded.last_reviewed_at,
    next_review_at = excluded.next_review_at,
    review_count = excluded.review_count,
    consecutive_successes = excluded.consecutive_successes,
    last_concept_score = excluded.last_concept_score,
    last_application_score = excluded.last_application_score,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

create or replace function public.commit_study_attempt(p_attempt_id uuid)
returns public.study_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempt public.study_attempts;
  prior public.knowledge_progress;
  streak integer;
  result_status text;
  next_review date;
  session public.study_sessions;
begin
  select * into attempt
  from public.study_attempts
  where id = p_attempt_id and user_id = (select auth.uid())
  for update;

  if attempt.id is null then
    raise exception 'Study attempt not found';
  end if;
  if attempt.status <> 'awaiting_confirmation' then
    raise exception 'Study attempt is not awaiting confirmation';
  end if;
  if attempt.expires_at <= now() then
    raise exception 'Study attempt has expired';
  end if;
  if attempt.recall_answer is null or attempt.application_answer is null
     or attempt.ai_feedback is null or attempt.ai_rationale is null
     or attempt.concept_score is null or attempt.application_score is null then
    raise exception 'Study attempt is incomplete';
  end if;

  select * into prior
  from public.knowledge_progress
  where user_id = attempt.user_id and concept_id = attempt.concept_id
  for update;

  if attempt.concept_score >= 2 and attempt.application_score >= 2 then
    streak := coalesce(prior.consecutive_successes, 0) + 1;
  else
    streak := 0;
  end if;

  if attempt.concept_score = 3 and attempt.application_score = 3 then
    result_status := 'verified';
  elsif attempt.concept_score >= 2 and attempt.application_score >= 2 then
    result_status := 'applied';
  else
    result_status := 'needs_review';
  end if;

  if attempt.concept_score <= 1 then
    next_review := current_date + 1;
  elsif attempt.application_score <= 1 then
    next_review := current_date + 3;
  elsif attempt.application_score = 2 then
    next_review := current_date + 7;
  else
    next_review := current_date + case least(streak, 3)
      when 0 then 14
      when 1 then 30
      when 2 then 60
      else 90
    end;
  end if;

  insert into public.study_sessions (
    user_id, attempt_id, concept_id, session_type,
    recall_question, recall_answer, application_question, application_answer,
    ai_feedback, ai_rationale, concept_score, application_score,
    resulting_status, resulting_next_review_at
  ) values (
    attempt.user_id, attempt.id, attempt.concept_id, attempt.session_type,
    attempt.recall_question, attempt.recall_answer, attempt.application_question, attempt.application_answer,
    attempt.ai_feedback, attempt.ai_rationale, attempt.concept_score, attempt.application_score,
    result_status, next_review
  ) returning * into session;

  insert into public.knowledge_progress (
    user_id, concept_id, status, first_learned_at, last_reviewed_at,
    next_review_at, review_count, consecutive_successes,
    last_concept_score, last_application_score
  ) values (
    attempt.user_id, attempt.concept_id, result_status,
    coalesce(prior.first_learned_at, current_date), current_date,
    next_review, coalesce(prior.review_count, 0) + 1, streak,
    attempt.concept_score, attempt.application_score
  )
  on conflict (user_id, concept_id) do update set
    status = excluded.status,
    first_learned_at = excluded.first_learned_at,
    last_reviewed_at = excluded.last_reviewed_at,
    next_review_at = excluded.next_review_at,
    review_count = excluded.review_count,
    consecutive_successes = excluded.consecutive_successes,
    last_concept_score = excluded.last_concept_score,
    last_application_score = excluded.last_application_score,
    updated_at = now();

  update public.study_attempts
  set status = 'committed', updated_at = now()
  where id = attempt.id;

  return session;
end;
$$;

create or replace function public.set_study_session_validity(
  p_session_id uuid,
  p_valid boolean,
  p_reason text default null
)
returns public.knowledge_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  session public.study_sessions;
begin
  select * into session
  from public.study_sessions
  where id = p_session_id and user_id = (select auth.uid())
  for update;

  if session.id is null then
    raise exception 'Study session not found';
  end if;

  update public.study_sessions
  set is_valid = p_valid,
      invalidated_at = case when p_valid then null else now() end,
      invalidated_reason = case when p_valid then null else coalesce(nullif(btrim(p_reason), ''), '人工作废') end
  where id = session.id;

  return public.rebuild_knowledge_progress(session.user_id, session.concept_id);
end;
$$;

revoke execute on function public.rebuild_knowledge_progress(uuid, uuid) from public, anon;
revoke execute on function public.commit_study_attempt(uuid) from public, anon;
revoke execute on function public.set_study_session_validity(uuid, boolean, text) from public, anon;
grant execute on function public.rebuild_knowledge_progress(uuid, uuid) to authenticated;
grant execute on function public.commit_study_attempt(uuid) to authenticated;
grant execute on function public.set_study_session_validity(uuid, boolean, text) to authenticated;
