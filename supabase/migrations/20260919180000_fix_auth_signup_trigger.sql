-- Auth creates users as supabase_auth_admin. The signup trigger lives in
-- private, so that role must be able to resolve private.handle_new_user().
grant usage on schema private to supabase_auth_admin, postgres;

grant execute on function private.handle_new_user() to supabase_auth_admin, postgres, service_role;
grant execute on function private.match_university_id(text) to supabase_auth_admin, postgres, service_role;
grant execute on function private.canonical_email_domain(text) to supabase_auth_admin, postgres, service_role;
