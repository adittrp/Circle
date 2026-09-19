-- Path 3: INSERT ... RETURNING on circles requires SELECT RLS to pass.
-- Membership is added after insert, so allow creators to read their own formed_by rows.

drop policy if exists circles_select_formed_by on public.circles;
create policy circles_select_formed_by on public.circles
  for select to authenticated
  using (formed_by = (select private.current_profile_id()));

-- Atomic hangout bootstrap: create circle + first membership in one transaction.
create or replace function public.create_hangout_circle(p_university_id uuid)
returns public.circles
language plpgsql
security invoker
set search_path = public
as $$
declare
  me uuid := private.current_profile_id();
  uni uuid := private.current_university_id();
  created public.circles;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if uni is null or p_university_id is distinct from uni then
    raise exception 'University mismatch';
  end if;

  insert into public.circles (university_id, stage, formed_by)
  values (p_university_id, 'introduced', me)
  returning * into created;

  insert into public.circle_members (circle_id, profile_id, member_role)
  values (created.id, me, 'member');

  return created;
end;
$$;

revoke all on function public.create_hangout_circle(uuid) from public, anon;
grant execute on function public.create_hangout_circle(uuid) to authenticated;
