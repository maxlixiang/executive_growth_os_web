alter table public.monthly_reviews
  add column if not exists review_number integer,
  add column if not exists title text;

with numbered as (
  select id, row_number() over (partition by user_id, journey_id order by created_at, id)::integer as value
  from public.monthly_reviews
)
update public.monthly_reviews item
set review_number = numbered.value,
    title = coalesce(item.title, '第' || numbered.value || '次复盘')
from numbered
where item.id = numbered.id and (item.review_number is null or item.title is null);

alter table public.monthly_reviews alter column review_number set not null;
alter table public.monthly_reviews alter column title set not null;
alter table public.monthly_reviews drop constraint if exists monthly_reviews_user_id_journey_id_period_start_key;
create unique index if not exists monthly_reviews_journey_number_idx
  on public.monthly_reviews(user_id, journey_id, review_number);

alter table public.interview_sessions
  alter column quarterly_review_id drop not null,
  add column if not exists title text not null default '自主模拟面试',
  add column if not exists feedback_markdown text;

create or replace function public.create_flexible_review(
  p_title text,
  p_period_start date,
  p_period_end date,
  p_review_markdown text,
  p_recommended_concept_ids jsonb,
  p_recommended_practice_challenges jsonb,
  p_recommended_focus_codes jsonb
)
returns public.monthly_reviews
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  active_journey uuid;
  next_number integer;
  saved public.monthly_reviews;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if p_period_end < p_period_start or p_period_end > current_date then raise exception 'Invalid review period'; end if;
  select id into active_journey from public.learning_journeys where user_id = uid and status = 'active';
  if active_journey is null then raise exception 'Active journey required'; end if;
  perform pg_advisory_xact_lock(hashtext(uid::text || active_journey::text));
  select coalesce(max(review_number), 0) + 1 into next_number
  from public.monthly_reviews where user_id = uid and journey_id = active_journey;

  insert into public.monthly_reviews (
    user_id, journey_id, review_number, title, period_start, period_end,
    review_markdown, recommended_concept_ids, recommended_practice_challenges, recommended_focus_codes
  ) values (
    uid, active_journey, next_number, coalesce(nullif(btrim(p_title), ''), '第' || next_number || '次复盘'),
    p_period_start, p_period_end, p_review_markdown,
    p_recommended_concept_ids, p_recommended_practice_challenges, p_recommended_focus_codes
  ) returning * into saved;

  insert into public.activity_events (user_id, journey_id, event_type, title, summary, source_type, source_id)
  values (uid, active_journey, 'review_created', '完成第' || next_number || '次复盘', saved.title, 'monthly_review', saved.id);
  return saved;
end;
$$;

revoke execute on function public.create_flexible_review(text, date, date, text, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.create_flexible_review(text, date, date, text, jsonb, jsonb, jsonb) to authenticated;
