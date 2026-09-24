create unique index daily_reflections_capture_entry_unique_idx
  on public.daily_reflections (capture_entry_id)
  where capture_entry_id is not null;

create or replace function public.finalize_capture_analysis(
  p_capture_id uuid,
  p_analysis jsonb
)
returns public.daily_reflections
language plpgsql
security definer
set search_path = ''
as $$
declare
  capture public.capture_entries;
  daily public.daily_reflections;
  item jsonb;
  capability uuid;
  concept uuid;
begin
  select * into capture
  from public.capture_entries
  where id = p_capture_id and user_id = (select auth.uid())
  for update;

  if capture.id is null then
    raise exception 'Capture entry not found';
  end if;

  select * into daily
  from public.daily_reflections
  where capture_entry_id = capture.id;
  if daily.id is not null then
    return daily;
  end if;

  insert into public.daily_reflections (
    user_id, capture_entry_id, raw_content, analysis, responsibility_hint
  ) values (
    capture.user_id,
    capture.id,
    capture.content,
    p_analysis->>'analysis',
    p_analysis->>'responsibility_hint'
  ) returning * into daily;

  for item in select value from jsonb_array_elements(coalesce(p_analysis->'capabilities', '[]'::jsonb))
  loop
    select id into capability from public.capabilities where lower(code) = lower(item->>'capability_code');
    if capability is not null then
      insert into public.daily_capability_tags (user_id, daily_reflection_id, capability_id, confidence)
      values (capture.user_id, daily.id, capability, greatest(0, least(1, coalesce((item->>'confidence')::numeric, 0.5))))
      on conflict (daily_reflection_id, capability_id) do update set confidence = excluded.confidence;
    end if;
  end loop;

  for item in select value from jsonb_array_elements(coalesce(p_analysis->'evidences', '[]'::jsonb))
  loop
    select id into capability from public.capabilities where lower(code) = lower(item->>'capability_code');
    if capability is not null then
      insert into public.practice_evidence (
        user_id, source_daily_id, capability_id, evidence_level, context, user_role,
        action, decision, stakeholders, outcome, why_it_matters, limitations, next_evidence_needed
      ) values (
        capture.user_id, daily.id, capability, item->>'evidence_level', item->>'context', item->>'user_role',
        item->>'action', item->>'decision', item->>'stakeholders', item->>'outcome', item->>'why_it_matters',
        item->>'limitations', item->>'next_evidence_needed'
      );
    end if;
  end loop;

  for item in
    select value || jsonb_build_object('gap_type', 'knowledge')
    from jsonb_array_elements(coalesce(p_analysis->'knowledge_gaps', '[]'::jsonb))
    union all
    select value || jsonb_build_object('gap_type', 'practice')
    from jsonb_array_elements(coalesce(p_analysis->'practice_gaps', '[]'::jsonb))
  loop
    capability := null;
    concept := null;
    select id into capability from public.capabilities where lower(code) = lower(item->>'capability_code');
    if nullif(item->>'concept_code', '') is not null then
      select id into concept from public.knowledge_concepts
      where concept_code = item->>'concept_code'
        and (capability is null or capability_id = capability)
      limit 1;
    end if;
    insert into public.growth_gaps (
      user_id, daily_reflection_id, gap_type, capability_id, concept_id, title, detail
    ) values (
      capture.user_id, daily.id, item->>'gap_type', capability, concept,
      coalesce(nullif(item->>'title', ''), '未命名 Gap'), item->>'detail'
    );
  end loop;

  update public.capture_entries
  set analysis_status = 'completed', analysis_error = null, analyzed_at = now(), updated_at = now()
  where id = capture.id;

  return daily;
end;
$$;

revoke execute on function public.finalize_capture_analysis(uuid, jsonb) from public, anon;
grant execute on function public.finalize_capture_analysis(uuid, jsonb) to authenticated;
