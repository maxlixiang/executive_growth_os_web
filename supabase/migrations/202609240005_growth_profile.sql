create or replace function public.set_growth_profile(
  p_overall_goal text,
  p_focus_codes text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  capability record;
  position integer := 0;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  insert into public.user_growth_state (user_id, overall_goal)
  values ((select auth.uid()), nullif(btrim(p_overall_goal), ''))
  on conflict (user_id) do update set overall_goal = excluded.overall_goal, updated_at = now();

  update public.user_focuses
  set is_active = false, ends_at = current_date, updated_at = now()
  where user_id = (select auth.uid()) and is_active;

  for capability in
    select id, code from public.capabilities
    where code = any(coalesce(p_focus_codes, array[]::text[]))
    order by array_position(p_focus_codes, code)
  loop
    position := position + 1;
    insert into public.user_focuses (user_id, capability_id, priority, is_active, starts_at)
    values ((select auth.uid()), capability.id, position, true, current_date);
  end loop;
end;
$$;

revoke execute on function public.set_growth_profile(text, text[]) from public, anon;
grant execute on function public.set_growth_profile(text, text[]) to authenticated;
