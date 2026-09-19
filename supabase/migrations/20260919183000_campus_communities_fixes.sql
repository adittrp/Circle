-- Follow-up fixes applied on remote after campus_communities_schema.

create or replace function private.set_post_university()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.university_id is null then
    if new.community_id is not null then
      select university_id into new.university_id from public.communities where id = new.community_id;
    else
      new.university_id := private.current_university_id();
    end if;
  end if;
  if auth.uid() is not null
     and private.current_university_id() is not null
     and new.university_id is distinct from private.current_university_id() then
    raise exception 'Posts must stay on your campus';
  end if;
  return new;
end;
$$;

create or replace function private.sync_communities_for_profile(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles%rowtype;
  uni public.universities%rowtype;
  major_name text;
  hall_name text;
  year_label text;
  cid uuid;
  interest_rec record;
begin
  select * into p from public.profiles where id = p_profile_id;
  if p.university_id is null then return; end if;
  select * into uni from public.universities where id = p.university_id;

  cid := private.ensure_community(p.university_id, 'campus', uni.name, uni.slug, 'Campus-wide community for ' || uni.name);
  perform private.join_community_if_allowed(cid, p_profile_id);

  if p.major_id is not null then
    select name into major_name from public.majors where id = p.major_id;
    cid := private.ensure_community(p.university_id, 'major', major_name, 'major-' || private.slugify(major_name), major_name || ' students at ' || uni.abbreviation, p.major_id);
    perform private.join_community_if_allowed(cid, p_profile_id);
  end if;

  if p.year is not null then
    year_label := case p.year
      when 'Freshman' then 'Freshmen'
      when 'Sophomore' then 'Sophomores'
      when 'Junior' then 'Juniors'
      when 'Senior' then 'Seniors'
      when 'Graduate' then 'Graduates'
      else p.year::text
    end;
    cid := private.ensure_community(p.university_id, 'year', year_label, 'year-' || lower(p.year::text), year_label || ' at ' || uni.abbreviation, null, null, null, p.year);
    perform private.join_community_if_allowed(cid, p_profile_id);
  end if;

  if p.residence_hall_id is not null then
    select name into hall_name from public.residence_halls where id = p.residence_hall_id;
    cid := private.ensure_community(p.university_id, 'residence', hall_name, 'residence-' || private.slugify(hall_name), 'Neighbors in ' || hall_name, null, p.residence_hall_id);
    perform private.join_community_if_allowed(cid, p_profile_id);
  end if;

  for interest_rec in
    select i.id, i.name, i.slug
    from public.user_interests ui
    join public.interests i on i.id = ui.interest_id
    where ui.user_id = p_profile_id
  loop
    cid := private.ensure_community(p.university_id, 'interest', interest_rec.name, 'interest-' || interest_rec.slug, interest_rec.name || ' at ' || uni.abbreviation, null, null, interest_rec.id);
    perform private.join_community_if_allowed(cid, p_profile_id);
  end loop;
end;
$$;
