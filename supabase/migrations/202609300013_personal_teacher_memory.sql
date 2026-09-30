-- Private, journey-scoped editable learner memory. Raw learning history remains canonical.
create table public.learner_memories (
  user_id uuid not null references auth.users(id),
  journey_id uuid not null,
  profile_markdown text not null default '' check (length(profile_markdown) <= 12000),
  updated_at timestamptz not null default now(),
  primary key (user_id, journey_id),
  foreign key (journey_id, user_id) references public.learning_journeys(id, user_id)
);
alter table public.learner_memories enable row level security;
create policy learner_memory_read_own on public.learner_memories for select to authenticated
  using (user_id = (select auth.uid()));
grant select on public.learner_memories to authenticated;
revoke insert, update, delete on public.learner_memories from authenticated;

create function public.save_learner_memory(p_journey_id uuid, p_markdown text)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if p_markdown is null or length(p_markdown) > 12000 then raise exception 'Invalid memory'; end if;
  perform pg_advisory_xact_lock(hashtext(uid::text));
  if not exists (select 1 from public.learning_journeys where id = p_journey_id and user_id = uid and status = 'active') then raise exception 'Active journey required'; end if;
  insert into public.learner_memories(user_id, journey_id, profile_markdown)
  values (uid, p_journey_id, btrim(p_markdown))
  on conflict (user_id, journey_id) do update set profile_markdown = excluded.profile_markdown, updated_at = now();
  insert into public.activity_events(user_id, journey_id, event_type, title, summary)
  values (uid, p_journey_id, 'learner_memory_updated', '更新私人老师的学习者档案', '用户主动纠正背景、基础、时间预算与学习偏好。');
end; $$;
revoke execute on function public.save_learner_memory(uuid, text) from public, anon;
grant execute on function public.save_learner_memory(uuid, text) to authenticated;

alter table public.study_attempts
  add column teaching_intro text,
  add column teaching_mode text not null default 'formal' check (teaching_mode in ('foundation', 'formal', 'review')),
  add column question_context_markdown text,
  add column evaluation_context_markdown text;
alter table public.interview_sessions
  add column rubric_version integer not null default 1,
  add column readiness_result jsonb;

create or replace function public.commit_study_attempt(p_attempt_id uuid)
returns public.study_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  attempt public.study_attempts;
  prior public.knowledge_progress;
  streak integer;
  result_status text;
  next_review date;
  session public.study_sessions;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  perform pg_advisory_xact_lock(hashtext(uid::text));
  select * into attempt
  from public.study_attempts
  where id = p_attempt_id and user_id = (select auth.uid())
  for update;

  if not exists (select 1 from public.learning_journeys where id = attempt.journey_id and user_id = uid and status = 'active') then
    raise exception 'Attempt journey is no longer active';
  end if;
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

  if attempt.teaching_mode = 'foundation' and attempt.concept_score >= 2 and attempt.application_score >= 2 then
    result_status := 'understood';
  elsif attempt.concept_score = 3 and attempt.application_score = 3 then
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

  if attempt.teaching_mode = 'foundation' then next_review := least(next_review, current_date + 7); end if;

  insert into public.study_sessions (
    user_id, journey_id, attempt_id, concept_id, session_type,
    recall_question, recall_answer, application_question, application_answer,
    ai_feedback, ai_rationale, concept_score, application_score,
    resulting_status, resulting_next_review_at
  ) values (
    attempt.user_id, attempt.journey_id, attempt.id, attempt.concept_id, attempt.session_type,
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

  insert into public.activity_events(user_id, journey_id, event_type, title, source_type, source_id)
  values (uid, attempt.journey_id, 'study_confirmed', '保存学习问答与老师反馈', 'study_session', session.id);
  return session;
end;
$$;

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
    select s.concept_score, s.application_score, s.committed_at, a.teaching_mode
    from public.study_sessions s left join public.study_attempts a on a.id = s.attempt_id and a.user_id = s.user_id and a.journey_id = s.journey_id
    where s.user_id = p_user_id and s.journey_id = active_journey and s.concept_id = p_concept_id and s.is_valid
    order by s.committed_at, s.id
  loop
    session_count := session_count + 1;
    reviewed_on := item.committed_at::date;
    first_learned := coalesce(first_learned, reviewed_on);
    if item.concept_score >= 2 and item.application_score >= 2 then streak := streak + 1; else streak := 0; end if;
    if item.teaching_mode = 'foundation' and item.concept_score >= 2 and item.application_score >= 2 then result_status := 'understood';
    elsif item.concept_score = 3 and item.application_score = 3 then result_status := 'verified';
    elsif item.concept_score >= 2 and item.application_score >= 2 then result_status := 'applied';
    else result_status := 'needs_review'; end if;
    if item.concept_score <= 1 then next_review := reviewed_on + 1;
    elsif item.application_score <= 1 then next_review := reviewed_on + 3;
    elsif item.application_score = 2 then next_review := reviewed_on + 7;
    else next_review := reviewed_on + case least(streak, 3) when 0 then 14 when 1 then 30 when 2 then 60 else 90 end;
    end if;
    if item.teaching_mode = 'foundation' then next_review := least(next_review, reviewed_on + 7); end if;
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
