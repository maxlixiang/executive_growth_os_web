alter table public.practice_evidence
  add column if not exists review_status text not null default 'candidate'
    check (review_status in ('candidate', 'confirmed', 'needs_more', 'invalidated')),
  add column if not exists reviewed_at timestamptz;

create index if not exists practice_evidence_review_queue_idx
  on public.practice_evidence(user_id, journey_id, review_status, created_at desc);

comment on column public.practice_evidence.review_status is
  'AI evidence starts as candidate. Only confirmed evidence may contribute to formal capability scoring.';
