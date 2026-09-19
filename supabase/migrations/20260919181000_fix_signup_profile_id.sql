-- Fix: PL/pgSQL variable named profile_id collided with the column in
-- INSERT ... ON CONFLICT (profile_id), which aborted every Auth signup.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_profile_id uuid;
  uni uuid;
begin
  if new.email is null or new.email !~* '@[^@]+\.edu$' then
    raise exception 'Circle accounts require a .edu email';
  end if;

  uni := private.match_university_id(new.email);

  insert into public.profiles (auth_user_id, email, university_id)
  values (new.id, new.email, uni)
  returning id into new_profile_id;

  insert into public.user_preferences (user_id)
  values (new_profile_id);

  insert into public.profile_verifications (profile_id, method)
  values (new_profile_id, 'edu_email')
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

grant execute on function private.handle_new_user() to supabase_auth_admin, postgres, service_role;
