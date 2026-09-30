-- Foundation understanding must not be recorded as complex applied/verified skill.
alter table public.study_sessions drop constraint study_sessions_resulting_status_check;
alter table public.study_sessions add constraint study_sessions_resulting_status_check
  check (resulting_status in ('understood', 'applied', 'verified', 'needs_review'));
