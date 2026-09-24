create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  timezone text not null default 'Asia/Shanghai',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.capabilities (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title_en text not null,
  title_zh text not null,
  sort_order integer not null check (sort_order > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.knowledge_categories (
  id uuid primary key default gen_random_uuid(),
  capability_id uuid not null references public.capabilities(id) on delete cascade,
  category_code text not null,
  title_en text,
  title_zh text not null,
  sort_order integer not null check (sort_order > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (capability_id, category_code),
  unique (capability_id, sort_order)
);

create table public.knowledge_concepts (
  id uuid primary key default gen_random_uuid(),
  capability_id uuid not null references public.capabilities(id) on delete restrict,
  category_id uuid not null references public.knowledge_categories(id) on delete restrict,
  concept_code text not null,
  title_en text not null,
  title_zh text not null,
  description text not null,
  why_it_matters text not null,
  core_principles jsonb not null default '[]'::jsonb check (jsonb_typeof(core_principles) = 'array'),
  key_questions jsonb not null default '[]'::jsonb check (jsonb_typeof(key_questions) = 'array'),
  application_questions jsonb not null default '[]'::jsonb check (jsonb_typeof(application_questions) = 'array'),
  common_mistakes jsonb not null default '[]'::jsonb check (jsonb_typeof(common_mistakes) = 'array'),
  tags jsonb not null default '[]'::jsonb check (jsonb_typeof(tags) = 'array'),
  sort_order integer not null check (sort_order > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (capability_id, concept_code),
  unique (capability_id, sort_order)
);

create table public.knowledge_concept_prerequisites (
  concept_id uuid not null references public.knowledge_concepts(id) on delete cascade,
  prerequisite_concept_id uuid not null references public.knowledge_concepts(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (concept_id, prerequisite_concept_id),
  check (concept_id <> prerequisite_concept_id)
);

create table public.user_focuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  capability_id uuid not null references public.capabilities(id) on delete restrict,
  priority integer not null default 1 check (priority > 0),
  note text,
  is_active boolean not null default true,
  starts_at date not null default current_date,
  ends_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create unique index user_focuses_one_active_capability_idx
  on public.user_focuses (user_id, capability_id) where is_active;

create table public.knowledge_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid not null references public.knowledge_concepts(id) on delete restrict,
  status text not null default 'unknown' check (status in ('unknown', 'learning', 'understood', 'applied', 'verified', 'needs_review')),
  first_learned_at date,
  last_reviewed_at date,
  next_review_at date,
  review_count integer not null default 0 check (review_count >= 0),
  consecutive_successes integer not null default 0 check (consecutive_successes >= 0),
  last_concept_score smallint check (last_concept_score between 0 and 3),
  last_application_score smallint check (last_application_score between 0 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, concept_id)
);

create table public.capture_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text not null check (length(btrim(content)) > 0),
  entry_type text not null check (entry_type in ('work_event', 'idea', 'question', 'follow_up')),
  analysis_status text not null default 'not_requested' check (analysis_status in ('not_requested', 'pending', 'processing', 'completed', 'failed')),
  analysis_error text,
  analyzed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.daily_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  capture_entry_id uuid,
  reflection_date date not null default current_date,
  raw_content text not null check (length(btrim(raw_content)) > 0),
  analysis text,
  responsibility_hint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (capture_entry_id, user_id) references public.capture_entries(id, user_id) on delete set null (capture_entry_id)
);

create table public.daily_capability_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_reflection_id uuid not null,
  capability_id uuid not null references public.capabilities(id) on delete restrict,
  confidence numeric(4,3) check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  unique (daily_reflection_id, capability_id),
  foreign key (daily_reflection_id, user_id) references public.daily_reflections(id, user_id) on delete cascade
);

create table public.growth_gaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_reflection_id uuid,
  gap_type text not null check (gap_type in ('knowledge', 'practice')),
  capability_id uuid references public.capabilities(id) on delete restrict,
  concept_id uuid references public.knowledge_concepts(id) on delete restrict,
  title text not null,
  detail text,
  status text not null default 'open' check (status in ('open', 'addressed', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (daily_reflection_id, user_id) references public.daily_reflections(id, user_id) on delete set null (daily_reflection_id)
);

create table public.practice_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_daily_id uuid,
  capability_id uuid not null references public.capabilities(id) on delete restrict,
  evidence_level text not null check (evidence_level in ('E0', 'E1', 'E2', 'E3', 'E4', 'E5')),
  context text,
  user_role text,
  action text,
  decision text,
  stakeholders text,
  outcome text,
  why_it_matters text,
  limitations text,
  next_evidence_needed text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (source_daily_id, user_id) references public.daily_reflections(id, user_id) on delete set null (source_daily_id)
);

create table public.study_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid not null references public.knowledge_concepts(id) on delete restrict,
  session_type text not null check (session_type in ('study', 'quiz')),
  status text not null default 'questioning' check (status in ('questioning', 'awaiting_confirmation', 'cancelled', 'expired', 'committed')),
  recall_question text not null,
  recall_answer text,
  application_question text not null,
  application_answer text,
  ai_feedback text,
  ai_rationale text,
  concept_score smallint check (concept_score between 0 and 3),
  application_score smallint check (application_score between 0 and 3),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id uuid,
  concept_id uuid not null references public.knowledge_concepts(id) on delete restrict,
  session_type text not null check (session_type in ('study', 'quiz')),
  recall_question text not null,
  recall_answer text not null,
  application_question text not null,
  application_answer text not null,
  ai_feedback text not null,
  ai_rationale text not null,
  concept_score smallint not null check (concept_score between 0 and 3),
  application_score smallint not null check (application_score between 0 and 3),
  resulting_status text not null check (resulting_status in ('applied', 'verified', 'needs_review')),
  resulting_next_review_at date not null,
  is_valid boolean not null default true,
  invalidated_at timestamptz,
  invalidated_reason text,
  committed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (attempt_id, user_id) references public.study_attempts(id, user_id) on delete set null (attempt_id)
);

create table public.user_growth_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  overall_goal text,
  capability_assessments jsonb not null default '{}'::jsonb,
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  knowledge_gaps jsonb not null default '[]'::jsonb,
  practice_gaps jsonb not null default '[]'::jsonb,
  recent_training_direction text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.monthly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  review_markdown text not null,
  recommended_concept_ids jsonb not null default '[]'::jsonb,
  recommended_practice_challenges jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_start),
  check (period_end >= period_start)
);

create table public.quarterly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  assessment_markdown text,
  executive_level_gaps jsonb not null default '[]'::jsonb,
  next_quarter_focus jsonb not null default '[]'::jsonb,
  status text not null default 'interviewing' check (status in ('interviewing', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, period_start),
  check (period_end >= period_start)
);

create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quarterly_review_id uuid not null,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (quarterly_review_id, user_id) references public.quarterly_reviews(id, user_id) on delete cascade
);

create table public.interview_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  interview_session_id uuid not null,
  role text not null check (role in ('interviewer', 'user')),
  content text not null check (length(btrim(content)) > 0),
  capability_id uuid references public.capabilities(id) on delete restrict,
  sequence_number integer not null check (sequence_number > 0),
  created_at timestamptz not null default now(),
  unique (interview_session_id, sequence_number),
  foreign key (interview_session_id, user_id) references public.interview_sessions(id, user_id) on delete cascade
);

create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  source_id uuid,
  model text not null,
  status text not null check (status in ('pending', 'running', 'completed', 'failed')),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index knowledge_categories_capability_id_idx on public.knowledge_categories(capability_id);
create index knowledge_concepts_capability_category_idx on public.knowledge_concepts(capability_id, category_id, sort_order);
create index user_focuses_user_priority_idx on public.user_focuses(user_id, priority) where is_active;
create index knowledge_progress_due_idx on public.knowledge_progress(user_id, next_review_at) where next_review_at is not null;
create index capture_entries_user_created_idx on public.capture_entries(user_id, created_at desc);
create index daily_reflections_user_date_idx on public.daily_reflections(user_id, reflection_date desc);
create index daily_capability_tags_user_idx on public.daily_capability_tags(user_id, daily_reflection_id);
create index growth_gaps_open_idx on public.growth_gaps(user_id, gap_type, created_at desc) where status = 'open';
create index practice_evidence_user_created_idx on public.practice_evidence(user_id, created_at desc);
create index study_attempts_user_status_idx on public.study_attempts(user_id, status, created_at desc);
create index study_sessions_user_concept_idx on public.study_sessions(user_id, concept_id, committed_at);
create index study_sessions_valid_idx on public.study_sessions(user_id, committed_at desc) where is_valid;
create index monthly_reviews_user_period_idx on public.monthly_reviews(user_id, period_start desc);
create index quarterly_reviews_user_period_idx on public.quarterly_reviews(user_id, period_start desc);
create index interview_sessions_user_started_idx on public.interview_sessions(user_id, started_at desc);
create index interview_messages_user_session_idx on public.interview_messages(user_id, interview_session_id, sequence_number);
create index ai_runs_user_created_idx on public.ai_runs(user_id, created_at desc);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles', 'capabilities', 'knowledge_categories', 'knowledge_concepts', 'user_focuses',
    'knowledge_progress', 'capture_entries', 'daily_reflections', 'growth_gaps', 'practice_evidence',
    'study_attempts', 'user_growth_state', 'monthly_reviews', 'quarterly_reviews', 'interview_sessions'
  ] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', table_name || '_set_updated_at', table_name);
  end loop;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'user_focuses', 'knowledge_progress', 'capture_entries', 'daily_reflections', 'daily_capability_tags',
    'growth_gaps', 'practice_evidence', 'study_attempts', 'study_sessions', 'user_growth_state',
    'monthly_reviews', 'quarterly_reviews', 'interview_sessions', 'interview_messages', 'ai_runs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', table_name || '_insert_own', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name || '_update_own', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', table_name || '_delete_own', table_name);
  end loop;
end;
$$;

alter table public.capabilities enable row level security;
alter table public.knowledge_categories enable row level security;
alter table public.knowledge_concepts enable row level security;
alter table public.knowledge_concept_prerequisites enable row level security;

create policy capabilities_authenticated_read on public.capabilities for select to authenticated using (true);
create policy knowledge_categories_authenticated_read on public.knowledge_categories for select to authenticated using (true);
create policy knowledge_concepts_authenticated_read on public.knowledge_concepts for select to authenticated using (true);
create policy knowledge_prerequisites_authenticated_read on public.knowledge_concept_prerequisites for select to authenticated using (true);

revoke all on all tables in schema public from anon;
revoke all on public.capabilities, public.knowledge_categories, public.knowledge_concepts, public.knowledge_concept_prerequisites from authenticated;
grant select on public.capabilities, public.knowledge_categories, public.knowledge_concepts, public.knowledge_concept_prerequisites to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_focuses, public.knowledge_progress, public.capture_entries,
  public.daily_reflections, public.daily_capability_tags, public.growth_gaps, public.practice_evidence,
  public.study_attempts, public.study_sessions, public.user_growth_state, public.monthly_reviews,
  public.quarterly_reviews, public.interview_sessions, public.interview_messages, public.ai_runs to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
