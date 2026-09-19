
do $$
declare uni_id uuid;
begin
  insert into public.universities (slug, name, abbreviation, city, primary_color, secondary_color, logo_path)
  values ('ut-austin', 'University of Texas at Austin', 'UT Austin', 'Austin', '#BF5700', '#333F48', '/universities/ut-austin.svg')
  on conflict (slug) do update set
    name = excluded.name,
    abbreviation = excluded.abbreviation,
    city = excluded.city,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    logo_path = excluded.logo_path
  returning id into uni_id;

  select id into uni_id from public.universities where slug = 'ut-austin';

  insert into public.university_email_domains (university_id, domain)
  select uni_id, d from unnest(ARRAY['utexas.edu']) as d
  on conflict (domain) do nothing;

  insert into public.majors (university_id, name)
  select uni_id, m from unnest(ARRAY['Accounting', 'Biology', 'Business Administration', 'Chemistry', 'Communications', 'Computer Science', 'Economics', 'Education', 'Electrical Engineering', 'English', 'Finance', 'History', 'Kinesiology', 'Marketing', 'Mathematics', 'Mechanical Engineering', 'Nursing', 'Political Science', 'Psychology', 'Undeclared', 'Radio-Television-Film', 'Petroleum Engineering', 'Government']) as m
  on conflict (university_id, name) do nothing;

  insert into public.residence_halls (university_id, name, is_off_campus, data_status)
  select uni_id, x.name, x.off, x.status
  from (values ('Jester West', false, 'verified'::public.data_status), ('Jester East', false, 'verified'::public.data_status), ('San Jacinto', false, 'verified'::public.data_status), ('Duren', false, 'verified'::public.data_status), ('Moore-Hill', false, 'verified'::public.data_status), ('Kinsolving', false, 'verified'::public.data_status), ('Off-campus', true, 'verified'::public.data_status)) as x(name, off, status)
  on conflict (university_id, name) do update set
    is_off_campus = excluded.is_off_campus,
    data_status = excluded.data_status;

  insert into public.campus_locations (university_id, name, category, data_status)
  select uni_id, x.name, x.category, x.status
  from (values ('Gregory Gym', 'gym'::public.location_category, 'verified'::public.data_status), ('Texas Union', 'hangout'::public.location_category, 'verified'::public.data_status), ('Perry-Castañeda Library (PCL)', 'library'::public.location_category, 'verified'::public.data_status), ('Jester City Limits', 'dining'::public.location_category, 'verified'::public.data_status), ('RecSports Outdoor Center', 'gym'::public.location_category, 'verified'::public.data_status)) as x(name, category, status)
  on conflict (university_id, name) do update set
    category = excluded.category,
    data_status = excluded.data_status;
end $$;


do $$
declare uni_id uuid;
begin
  insert into public.universities (slug, name, abbreviation, city, primary_color, secondary_color, logo_path)
  values ('tamu', 'Texas A&M University', 'Texas A&M', 'College Station', '#500000', '#FFFFFF', '/universities/tamu.svg')
  on conflict (slug) do update set
    name = excluded.name,
    abbreviation = excluded.abbreviation,
    city = excluded.city,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    logo_path = excluded.logo_path
  returning id into uni_id;

  select id into uni_id from public.universities where slug = 'tamu';

  insert into public.university_email_domains (university_id, domain)
  select uni_id, d from unnest(ARRAY['tamu.edu']) as d
  on conflict (domain) do nothing;

  insert into public.majors (university_id, name)
  select uni_id, m from unnest(ARRAY['Accounting', 'Biology', 'Business Administration', 'Chemistry', 'Communications', 'Computer Science', 'Economics', 'Education', 'Electrical Engineering', 'English', 'Finance', 'History', 'Kinesiology', 'Marketing', 'Mathematics', 'Mechanical Engineering', 'Nursing', 'Political Science', 'Psychology', 'Undeclared', 'Petroleum Engineering', 'Agricultural Economics']) as m
  on conflict (university_id, name) do nothing;

  insert into public.residence_halls (university_id, name, is_off_campus, data_status)
  select uni_id, x.name, x.off, x.status
  from (values ('Hullabaloo Hall', false, 'verified'::public.data_status), ('Mosher Hall', false, 'needs_review'::public.data_status), ('Dunn Hall', false, 'needs_review'::public.data_status), ('Off-campus', true, 'verified'::public.data_status)) as x(name, off, status)
  on conflict (university_id, name) do update set
    is_off_campus = excluded.is_off_campus,
    data_status = excluded.data_status;

  insert into public.campus_locations (university_id, name, category, data_status)
  select uni_id, x.name, x.category, x.status
  from (values ('Memorial Student Center', 'hangout'::public.location_category, 'verified'::public.data_status), ('Sterling C. Evans Library', 'library'::public.location_category, 'verified'::public.data_status), ('Student Recreation Center', 'gym'::public.location_category, 'verified'::public.data_status), ('Sbisa Dining Hall', 'dining'::public.location_category, 'needs_review'::public.data_status)) as x(name, category, status)
  on conflict (university_id, name) do update set
    category = excluded.category,
    data_status = excluded.data_status;
end $$;


do $$
declare uni_id uuid;
begin
  insert into public.universities (slug, name, abbreviation, city, primary_color, secondary_color, logo_path)
  values ('texas-tech', 'Texas Tech University', 'Texas Tech', 'Lubbock', '#CC0000', '#000000', '/universities/texas-tech.svg')
  on conflict (slug) do update set
    name = excluded.name,
    abbreviation = excluded.abbreviation,
    city = excluded.city,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    logo_path = excluded.logo_path
  returning id into uni_id;

  select id into uni_id from public.universities where slug = 'texas-tech';

  insert into public.university_email_domains (university_id, domain)
  select uni_id, d from unnest(ARRAY['ttu.edu']) as d
  on conflict (domain) do nothing;

  insert into public.majors (university_id, name)
  select uni_id, m from unnest(ARRAY['Accounting', 'Biology', 'Business Administration', 'Chemistry', 'Communications', 'Computer Science', 'Economics', 'Education', 'Electrical Engineering', 'English', 'Finance', 'History', 'Kinesiology', 'Marketing', 'Mathematics', 'Mechanical Engineering', 'Nursing', 'Political Science', 'Psychology', 'Undeclared']) as m
  on conflict (university_id, name) do nothing;

  insert into public.residence_halls (university_id, name, is_off_campus, data_status)
  select uni_id, x.name, x.off, x.status
  from (values ('Talkington Hall', false, 'needs_review'::public.data_status), ('Horn Hall', false, 'needs_review'::public.data_status), ('Off-campus', true, 'verified'::public.data_status)) as x(name, off, status)
  on conflict (university_id, name) do update set
    is_off_campus = excluded.is_off_campus,
    data_status = excluded.data_status;

  insert into public.campus_locations (university_id, name, category, data_status)
  select uni_id, x.name, x.category, x.status
  from (values ('Student Union Building', 'hangout'::public.location_category, 'verified'::public.data_status), ('University Library', 'library'::public.location_category, 'verified'::public.data_status), ('Student Recreation Center', 'gym'::public.location_category, 'verified'::public.data_status)) as x(name, category, status)
  on conflict (university_id, name) do update set
    category = excluded.category,
    data_status = excluded.data_status;
end $$;


do $$
declare uni_id uuid;
begin
  insert into public.universities (slug, name, abbreviation, city, primary_color, secondary_color, logo_path)
  values ('uh', 'University of Houston', 'UH', 'Houston', '#C8102E', '#FFFFFF', '/universities/uh.svg')
  on conflict (slug) do update set
    name = excluded.name,
    abbreviation = excluded.abbreviation,
    city = excluded.city,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    logo_path = excluded.logo_path
  returning id into uni_id;

  select id into uni_id from public.universities where slug = 'uh';

  insert into public.university_email_domains (university_id, domain)
  select uni_id, d from unnest(ARRAY['uh.edu', 'cougarnet.uh.edu']) as d
  on conflict (domain) do nothing;

  insert into public.majors (university_id, name)
  select uni_id, m from unnest(ARRAY['Accounting', 'Biology', 'Business Administration', 'Chemistry', 'Communications', 'Computer Science', 'Economics', 'Education', 'Electrical Engineering', 'English', 'Finance', 'History', 'Kinesiology', 'Marketing', 'Mathematics', 'Mechanical Engineering', 'Nursing', 'Political Science', 'Psychology', 'Undeclared']) as m
  on conflict (university_id, name) do nothing;

  insert into public.residence_halls (university_id, name, is_off_campus, data_status)
  select uni_id, x.name, x.off, x.status
  from (values ('Cougar Village I', false, 'needs_review'::public.data_status), ('Moody Towers', false, 'needs_review'::public.data_status), ('Off-campus', true, 'verified'::public.data_status)) as x(name, off, status)
  on conflict (university_id, name) do update set
    is_off_campus = excluded.is_off_campus,
    data_status = excluded.data_status;

  insert into public.campus_locations (university_id, name, category, data_status)
  select uni_id, x.name, x.category, x.status
  from (values ('Student Center', 'hangout'::public.location_category, 'verified'::public.data_status), ('MD Anderson Library', 'library'::public.location_category, 'verified'::public.data_status), ('Campus Recreation and Wellness Center', 'gym'::public.location_category, 'verified'::public.data_status)) as x(name, category, status)
  on conflict (university_id, name) do update set
    category = excluded.category,
    data_status = excluded.data_status;
end $$;


do $$
declare uni_id uuid;
begin
  insert into public.universities (slug, name, abbreviation, city, primary_color, secondary_color, logo_path)
  values ('unt', 'University of North Texas', 'UNT', 'Denton', '#00853E', '#FFFFFF', '/universities/unt.svg')
  on conflict (slug) do update set
    name = excluded.name,
    abbreviation = excluded.abbreviation,
    city = excluded.city,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    logo_path = excluded.logo_path
  returning id into uni_id;

  select id into uni_id from public.universities where slug = 'unt';

  insert into public.university_email_domains (university_id, domain)
  select uni_id, d from unnest(ARRAY['unt.edu', 'my.unt.edu']) as d
  on conflict (domain) do nothing;

  insert into public.majors (university_id, name)
  select uni_id, m from unnest(ARRAY['Accounting', 'Biology', 'Business Administration', 'Chemistry', 'Communications', 'Computer Science', 'Economics', 'Education', 'Electrical Engineering', 'English', 'Finance', 'History', 'Kinesiology', 'Marketing', 'Mathematics', 'Mechanical Engineering', 'Nursing', 'Political Science', 'Psychology', 'Undeclared', 'Music', 'Journalism']) as m
  on conflict (university_id, name) do nothing;

  insert into public.residence_halls (university_id, name, is_off_campus, data_status)
  select uni_id, x.name, x.off, x.status
  from (values ('Kerr Hall', false, 'needs_review'::public.data_status), ('Maple Hall', false, 'needs_review'::public.data_status), ('Off-campus', true, 'verified'::public.data_status)) as x(name, off, status)
  on conflict (university_id, name) do update set
    is_off_campus = excluded.is_off_campus,
    data_status = excluded.data_status;

  insert into public.campus_locations (university_id, name, category, data_status)
  select uni_id, x.name, x.category, x.status
  from (values ('University Union', 'hangout'::public.location_category, 'verified'::public.data_status), ('Willis Library', 'library'::public.location_category, 'verified'::public.data_status), ('Rec Center', 'gym'::public.location_category, 'verified'::public.data_status)) as x(name, category, status)
  on conflict (university_id, name) do update set
    category = excluded.category,
    data_status = excluded.data_status;
end $$;


do $$
declare uni_id uuid;
begin
  insert into public.universities (slug, name, abbreviation, city, primary_color, secondary_color, logo_path)
  values ('texas-state', 'Texas State University', 'Texas State', 'San Marcos', '#501214', '#AC8D2A', '/universities/texas-state.svg')
  on conflict (slug) do update set
    name = excluded.name,
    abbreviation = excluded.abbreviation,
    city = excluded.city,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    logo_path = excluded.logo_path
  returning id into uni_id;

  select id into uni_id from public.universities where slug = 'texas-state';

  insert into public.university_email_domains (university_id, domain)
  select uni_id, d from unnest(ARRAY['txstate.edu']) as d
  on conflict (domain) do nothing;

  insert into public.majors (university_id, name)
  select uni_id, m from unnest(ARRAY['Accounting', 'Biology', 'Business Administration', 'Chemistry', 'Communications', 'Computer Science', 'Economics', 'Education', 'Electrical Engineering', 'English', 'Finance', 'History', 'Kinesiology', 'Marketing', 'Mathematics', 'Mechanical Engineering', 'Nursing', 'Political Science', 'Psychology', 'Undeclared']) as m
  on conflict (university_id, name) do nothing;

  insert into public.residence_halls (university_id, name, is_off_campus, data_status)
  select uni_id, x.name, x.off, x.status
  from (values ('Sterry Hall', false, 'needs_review'::public.data_status), ('Beretta Hall', false, 'needs_review'::public.data_status), ('Off-campus', true, 'verified'::public.data_status)) as x(name, off, status)
  on conflict (university_id, name) do update set
    is_off_campus = excluded.is_off_campus,
    data_status = excluded.data_status;

  insert into public.campus_locations (university_id, name, category, data_status)
  select uni_id, x.name, x.category, x.status
  from (values ('LBJ Student Center', 'hangout'::public.location_category, 'verified'::public.data_status), ('Alkek Library', 'library'::public.location_category, 'verified'::public.data_status), ('Student Recreation Center', 'gym'::public.location_category, 'verified'::public.data_status)) as x(name, category, status)
  on conflict (university_id, name) do update set
    category = excluded.category,
    data_status = excluded.data_status;
end $$;


do $$
declare uni_id uuid;
begin
  insert into public.universities (slug, name, abbreviation, city, primary_color, secondary_color, logo_path)
  values ('ut-dallas', 'University of Texas at Dallas', 'UT Dallas', 'Richardson', '#E87500', '#154734', '/universities/ut-dallas.svg')
  on conflict (slug) do update set
    name = excluded.name,
    abbreviation = excluded.abbreviation,
    city = excluded.city,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    logo_path = excluded.logo_path
  returning id into uni_id;

  select id into uni_id from public.universities where slug = 'ut-dallas';

  insert into public.university_email_domains (university_id, domain)
  select uni_id, d from unnest(ARRAY['utdallas.edu']) as d
  on conflict (domain) do nothing;

  insert into public.majors (university_id, name)
  select uni_id, m from unnest(ARRAY['Accounting', 'Biology', 'Business Administration', 'Chemistry', 'Communications', 'Computer Science', 'Economics', 'Education', 'Electrical Engineering', 'English', 'Finance', 'History', 'Kinesiology', 'Marketing', 'Mathematics', 'Mechanical Engineering', 'Nursing', 'Political Science', 'Psychology', 'Undeclared', 'Computer Engineering', 'Neuroscience']) as m
  on conflict (university_id, name) do nothing;

  insert into public.residence_halls (university_id, name, is_off_campus, data_status)
  select uni_id, x.name, x.off, x.status
  from (values ('Residence Hall North', false, 'needs_review'::public.data_status), ('Residence Hall South', false, 'needs_review'::public.data_status), ('Off-campus', true, 'verified'::public.data_status)) as x(name, off, status)
  on conflict (university_id, name) do update set
    is_off_campus = excluded.is_off_campus,
    data_status = excluded.data_status;

  insert into public.campus_locations (university_id, name, category, data_status)
  select uni_id, x.name, x.category, x.status
  from (values ('Student Union', 'hangout'::public.location_category, 'verified'::public.data_status), ('Eugene McDermott Library', 'library'::public.location_category, 'verified'::public.data_status), ('Activity Center', 'gym'::public.location_category, 'verified'::public.data_status)) as x(name, category, status)
  on conflict (university_id, name) do update set
    category = excluded.category,
    data_status = excluded.data_status;
end $$;


do $$
declare uni_id uuid;
begin
  insert into public.universities (slug, name, abbreviation, city, primary_color, secondary_color, logo_path)
  values ('ut-arlington', 'University of Texas at Arlington', 'UT Arlington', 'Arlington', '#0064B1', '#F58025', '/universities/ut-arlington.svg')
  on conflict (slug) do update set
    name = excluded.name,
    abbreviation = excluded.abbreviation,
    city = excluded.city,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    logo_path = excluded.logo_path
  returning id into uni_id;

  select id into uni_id from public.universities where slug = 'ut-arlington';

  insert into public.university_email_domains (university_id, domain)
  select uni_id, d from unnest(ARRAY['uta.edu', 'mavs.uta.edu']) as d
  on conflict (domain) do nothing;

  insert into public.majors (university_id, name)
  select uni_id, m from unnest(ARRAY['Accounting', 'Biology', 'Business Administration', 'Chemistry', 'Communications', 'Computer Science', 'Economics', 'Education', 'Electrical Engineering', 'English', 'Finance', 'History', 'Kinesiology', 'Marketing', 'Mathematics', 'Mechanical Engineering', 'Nursing', 'Political Science', 'Psychology', 'Undeclared']) as m
  on conflict (university_id, name) do nothing;

  insert into public.residence_halls (university_id, name, is_off_campus, data_status)
  select uni_id, x.name, x.off, x.status
  from (values ('Arlington Hall', false, 'needs_review'::public.data_status), ('Vandergriff Hall', false, 'needs_review'::public.data_status), ('Off-campus', true, 'verified'::public.data_status)) as x(name, off, status)
  on conflict (university_id, name) do update set
    is_off_campus = excluded.is_off_campus,
    data_status = excluded.data_status;

  insert into public.campus_locations (university_id, name, category, data_status)
  select uni_id, x.name, x.category, x.status
  from (values ('E.H. Hereford University Center', 'hangout'::public.location_category, 'verified'::public.data_status), ('Central Library', 'library'::public.location_category, 'verified'::public.data_status), ('Maverick Activities Center', 'gym'::public.location_category, 'verified'::public.data_status)) as x(name, category, status)
  on conflict (university_id, name) do update set
    category = excluded.category,
    data_status = excluded.data_status;
end $$;


do $$
declare uni_id uuid;
begin
  insert into public.universities (slug, name, abbreviation, city, primary_color, secondary_color, logo_path)
  values ('utsa', 'University of Texas at San Antonio', 'UTSA', 'San Antonio', '#F15A22', '#0C2340', '/universities/utsa.svg')
  on conflict (slug) do update set
    name = excluded.name,
    abbreviation = excluded.abbreviation,
    city = excluded.city,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    logo_path = excluded.logo_path
  returning id into uni_id;

  select id into uni_id from public.universities where slug = 'utsa';

  insert into public.university_email_domains (university_id, domain)
  select uni_id, d from unnest(ARRAY['utsa.edu', 'my.utsa.edu']) as d
  on conflict (domain) do nothing;

  insert into public.majors (university_id, name)
  select uni_id, m from unnest(ARRAY['Accounting', 'Biology', 'Business Administration', 'Chemistry', 'Communications', 'Computer Science', 'Economics', 'Education', 'Electrical Engineering', 'English', 'Finance', 'History', 'Kinesiology', 'Marketing', 'Mathematics', 'Mechanical Engineering', 'Nursing', 'Political Science', 'Psychology', 'Undeclared']) as m
  on conflict (university_id, name) do nothing;

  insert into public.residence_halls (university_id, name, is_off_campus, data_status)
  select uni_id, x.name, x.off, x.status
  from (values ('Chisholm Hall', false, 'needs_review'::public.data_status), ('Alvarez Hall', false, 'needs_review'::public.data_status), ('Off-campus', true, 'verified'::public.data_status)) as x(name, off, status)
  on conflict (university_id, name) do update set
    is_off_campus = excluded.is_off_campus,
    data_status = excluded.data_status;

  insert into public.campus_locations (university_id, name, category, data_status)
  select uni_id, x.name, x.category, x.status
  from (values ('University Center', 'hangout'::public.location_category, 'verified'::public.data_status), ('John Peace Library', 'library'::public.location_category, 'verified'::public.data_status), ('Recreation Center', 'gym'::public.location_category, 'verified'::public.data_status)) as x(name, category, status)
  on conflict (university_id, name) do update set
    category = excluded.category,
    data_status = excluded.data_status;
end $$;


do $$
declare uni_id uuid;
begin
  insert into public.universities (slug, name, abbreviation, city, primary_color, secondary_color, logo_path)
  values ('rice', 'Rice University', 'Rice', 'Houston', '#00205B', '#7C7E7F', '/universities/rice.svg')
  on conflict (slug) do update set
    name = excluded.name,
    abbreviation = excluded.abbreviation,
    city = excluded.city,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    logo_path = excluded.logo_path
  returning id into uni_id;

  select id into uni_id from public.universities where slug = 'rice';

  insert into public.university_email_domains (university_id, domain)
  select uni_id, d from unnest(ARRAY['rice.edu']) as d
  on conflict (domain) do nothing;

  insert into public.majors (university_id, name)
  select uni_id, m from unnest(ARRAY['Accounting', 'Biology', 'Business Administration', 'Chemistry', 'Communications', 'Computer Science', 'Economics', 'Education', 'Electrical Engineering', 'English', 'Finance', 'History', 'Kinesiology', 'Marketing', 'Mathematics', 'Mechanical Engineering', 'Nursing', 'Political Science', 'Psychology', 'Undeclared']) as m
  on conflict (university_id, name) do nothing;

  insert into public.residence_halls (university_id, name, is_off_campus, data_status)
  select uni_id, x.name, x.off, x.status
  from (values ('Baker College', false, 'verified'::public.data_status), ('Will Rice College', false, 'verified'::public.data_status), ('Hanszen College', false, 'verified'::public.data_status), ('Off-campus', true, 'verified'::public.data_status)) as x(name, off, status)
  on conflict (university_id, name) do update set
    is_off_campus = excluded.is_off_campus,
    data_status = excluded.data_status;

  insert into public.campus_locations (university_id, name, category, data_status)
  select uni_id, x.name, x.category, x.status
  from (values ('Rice Memorial Center', 'hangout'::public.location_category, 'verified'::public.data_status), ('Fondren Library', 'library'::public.location_category, 'verified'::public.data_status), ('Barbara and David Gibbs Recreation and Wellness Center', 'gym'::public.location_category, 'verified'::public.data_status)) as x(name, category, status)
  on conflict (university_id, name) do update set
    category = excluded.category,
    data_status = excluded.data_status;
end $$;


do $$
declare uni_id uuid;
begin
  insert into public.universities (slug, name, abbreviation, city, primary_color, secondary_color, logo_path)
  values ('baylor', 'Baylor University', 'Baylor', 'Waco', '#154734', '#FFB81C', '/universities/baylor.svg')
  on conflict (slug) do update set
    name = excluded.name,
    abbreviation = excluded.abbreviation,
    city = excluded.city,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    logo_path = excluded.logo_path
  returning id into uni_id;

  select id into uni_id from public.universities where slug = 'baylor';

  insert into public.university_email_domains (university_id, domain)
  select uni_id, d from unnest(ARRAY['baylor.edu']) as d
  on conflict (domain) do nothing;

  insert into public.majors (university_id, name)
  select uni_id, m from unnest(ARRAY['Accounting', 'Biology', 'Business Administration', 'Chemistry', 'Communications', 'Computer Science', 'Economics', 'Education', 'Electrical Engineering', 'English', 'Finance', 'History', 'Kinesiology', 'Marketing', 'Mathematics', 'Mechanical Engineering', 'Nursing', 'Political Science', 'Psychology', 'Undeclared']) as m
  on conflict (university_id, name) do nothing;

  insert into public.residence_halls (university_id, name, is_off_campus, data_status)
  select uni_id, x.name, x.off, x.status
  from (values ('Brooks Residential College', false, 'needs_review'::public.data_status), ('Collins Hall', false, 'needs_review'::public.data_status), ('Off-campus', true, 'verified'::public.data_status)) as x(name, off, status)
  on conflict (university_id, name) do update set
    is_off_campus = excluded.is_off_campus,
    data_status = excluded.data_status;

  insert into public.campus_locations (university_id, name, category, data_status)
  select uni_id, x.name, x.category, x.status
  from (values ('Bill Daniel Student Center', 'hangout'::public.location_category, 'verified'::public.data_status), ('Moody Memorial Library', 'library'::public.location_category, 'verified'::public.data_status), ('McLane Student Life Center', 'gym'::public.location_category, 'verified'::public.data_status)) as x(name, category, status)
  on conflict (university_id, name) do update set
    category = excluded.category,
    data_status = excluded.data_status;
end $$;


do $$
declare uni_id uuid;
begin
  insert into public.universities (slug, name, abbreviation, city, primary_color, secondary_color, logo_path)
  values ('tcu', 'Texas Christian University', 'TCU', 'Fort Worth', '#4D1979', '#A3A9AC', '/universities/tcu.svg')
  on conflict (slug) do update set
    name = excluded.name,
    abbreviation = excluded.abbreviation,
    city = excluded.city,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    logo_path = excluded.logo_path
  returning id into uni_id;

  select id into uni_id from public.universities where slug = 'tcu';

  insert into public.university_email_domains (university_id, domain)
  select uni_id, d from unnest(ARRAY['tcu.edu']) as d
  on conflict (domain) do nothing;

  insert into public.majors (university_id, name)
  select uni_id, m from unnest(ARRAY['Accounting', 'Biology', 'Business Administration', 'Chemistry', 'Communications', 'Computer Science', 'Economics', 'Education', 'Electrical Engineering', 'English', 'Finance', 'History', 'Kinesiology', 'Marketing', 'Mathematics', 'Mechanical Engineering', 'Nursing', 'Political Science', 'Psychology', 'Undeclared']) as m
  on conflict (university_id, name) do nothing;

  insert into public.residence_halls (university_id, name, is_off_campus, data_status)
  select uni_id, x.name, x.off, x.status
  from (values ('Tom Brown Hall', false, 'needs_review'::public.data_status), ('Waits Hall', false, 'needs_review'::public.data_status), ('Off-campus', true, 'verified'::public.data_status)) as x(name, off, status)
  on conflict (university_id, name) do update set
    is_off_campus = excluded.is_off_campus,
    data_status = excluded.data_status;

  insert into public.campus_locations (university_id, name, category, data_status)
  select uni_id, x.name, x.category, x.status
  from (values ('Brown-Lupton University Union', 'hangout'::public.location_category, 'verified'::public.data_status), ('Mary Couts Burnett Library', 'library'::public.location_category, 'verified'::public.data_status), ('University Recreation Center', 'gym'::public.location_category, 'verified'::public.data_status)) as x(name, category, status)
  on conflict (university_id, name) do update set
    category = excluded.category,
    data_status = excluded.data_status;
end $$;


do $$
declare uni_id uuid;
begin
  insert into public.universities (slug, name, abbreviation, city, primary_color, secondary_color, logo_path)
  values ('smu', 'Southern Methodist University', 'SMU', 'Dallas', '#0033A0', '#C8102E', '/universities/smu.svg')
  on conflict (slug) do update set
    name = excluded.name,
    abbreviation = excluded.abbreviation,
    city = excluded.city,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    logo_path = excluded.logo_path
  returning id into uni_id;

  select id into uni_id from public.universities where slug = 'smu';

  insert into public.university_email_domains (university_id, domain)
  select uni_id, d from unnest(ARRAY['smu.edu']) as d
  on conflict (domain) do nothing;

  insert into public.majors (university_id, name)
  select uni_id, m from unnest(ARRAY['Accounting', 'Biology', 'Business Administration', 'Chemistry', 'Communications', 'Computer Science', 'Economics', 'Education', 'Electrical Engineering', 'English', 'Finance', 'History', 'Kinesiology', 'Marketing', 'Mathematics', 'Mechanical Engineering', 'Nursing', 'Political Science', 'Psychology', 'Undeclared']) as m
  on conflict (university_id, name) do nothing;

  insert into public.residence_halls (university_id, name, is_off_campus, data_status)
  select uni_id, x.name, x.off, x.status
  from (values ('Boaz Hall', false, 'needs_review'::public.data_status), ('McElvaney Hall', false, 'needs_review'::public.data_status), ('Off-campus', true, 'verified'::public.data_status)) as x(name, off, status)
  on conflict (university_id, name) do update set
    is_off_campus = excluded.is_off_campus,
    data_status = excluded.data_status;

  insert into public.campus_locations (university_id, name, category, data_status)
  select uni_id, x.name, x.category, x.status
  from (values ('Hughes-Trigg Student Center', 'hangout'::public.location_category, 'verified'::public.data_status), ('Fondren Library Center', 'library'::public.location_category, 'verified'::public.data_status), ('Dedman Center for Lifetime Sports', 'gym'::public.location_category, 'verified'::public.data_status)) as x(name, category, status)
  on conflict (university_id, name) do update set
    category = excluded.category,
    data_status = excluded.data_status;
end $$;


insert into public.interests (slug, name, category)
values ('basketball', 'Basketball', 'Sports'),
('soccer', 'Soccer', 'Sports'),
('intramurals', 'Intramurals', 'Sports'),
('volleyball', 'Volleyball', 'Sports'),
('gym', 'Gym', 'Fitness'),
('running', 'Running', 'Fitness'),
('yoga', 'Yoga', 'Fitness'),
('video-games', 'Video games', 'Gaming'),
('board-games', 'Board games', 'Gaming'),
('live-music', 'Live music', 'Music'),
('concerts', 'Concerts', 'Music'),
('playlists', 'Making playlists', 'Music'),
('tacos', 'Tacos', 'Food'),
('coffee', 'Coffee', 'Food'),
('brunch', 'Brunch', 'Food'),
('cooking', 'Cooking', 'Food'),
('hiking', 'Hiking', 'Outdoors'),
('exploring-city', 'Exploring the city', 'Outdoors'),
('movies', 'Movies', 'Movies'),
('film', 'Film', 'Movies'),
('coding', 'Coding', 'Technology'),
('startups', 'Startups', 'Technology'),
('photography', 'Photography', 'Art'),
('design', 'Design', 'Art'),
('student-orgs', 'Student orgs', 'Campus Life'),
('sports-games', 'Game days', 'Campus Life'),
('going-out', 'Going out', 'Nightlife'),
('late-night-food', 'Late-night food', 'Nightlife'),
('study-groups', 'Study groups', 'Studying'),
('libraries', 'Library hangs', 'Studying'),
('road-trips', 'Road trips', 'Travel'),
('weekend-getaways', 'Weekend getaways', 'Travel')
on conflict (slug) do update set name = excluded.name, category = excluded.category;
