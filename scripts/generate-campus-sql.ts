import { INTEREST_SEED, TEXAS_UNIVERSITIES } from "../src/data/texasUniversities";

function lit(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function arrayLit(values: string[]) {
  return `ARRAY[${values.map(lit).join(", ")}]`;
}

const parts: string[] = [];

for (const uni of TEXAS_UNIVERSITIES) {
  const majors = arrayLit(uni.majors);
  const halls = uni.residenceHalls
    .map(
      (h) =>
        `(${lit(h.name)}, ${h.isOffCampus ? "true" : "false"}, '${h.dataStatus}'::public.data_status)`
    )
    .join(", ");
  const locs = uni.locations
    .map(
      (l) =>
        `(${lit(l.name)}, '${l.category}'::public.location_category, '${l.dataStatus}'::public.data_status)`
    )
    .join(", ");
  const domains = arrayLit(uni.domains.map((d) => d.toLowerCase()));

  parts.push(`
do $$
declare uni_id uuid;
begin
  insert into public.universities (slug, name, abbreviation, city, primary_color, secondary_color, logo_path)
  values (${lit(uni.slug)}, ${lit(uni.name)}, ${lit(uni.abbreviation)}, ${lit(uni.city)}, ${lit(uni.primaryColor)}, ${lit(uni.secondaryColor)}, ${lit(uni.logoPath)})
  on conflict (slug) do update set
    name = excluded.name,
    abbreviation = excluded.abbreviation,
    city = excluded.city,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    logo_path = excluded.logo_path
  returning id into uni_id;

  select id into uni_id from public.universities where slug = ${lit(uni.slug)};

  insert into public.university_email_domains (university_id, domain)
  select uni_id, d from unnest(${domains}) as d
  on conflict (domain) do nothing;

  insert into public.majors (university_id, name)
  select uni_id, m from unnest(${majors}) as m
  on conflict (university_id, name) do nothing;

  insert into public.residence_halls (university_id, name, is_off_campus, data_status)
  select uni_id, x.name, x.off, x.status
  from (values ${halls}) as x(name, off, status)
  on conflict (university_id, name) do update set
    is_off_campus = excluded.is_off_campus,
    data_status = excluded.data_status;

  insert into public.campus_locations (university_id, name, category, data_status)
  select uni_id, x.name, x.category, x.status
  from (values ${locs}) as x(name, category, status)
  on conflict (university_id, name) do update set
    category = excluded.category,
    data_status = excluded.data_status;
end $$;
`);
}

parts.push(`
insert into public.interests (slug, name, category)
values ${INTEREST_SEED.map((i) => `(${lit(i.slug)}, ${lit(i.name)}, ${lit(i.category)})`).join(",\n")}
on conflict (slug) do update set name = excluded.name, category = excluded.category;
`);

process.stdout.write(parts.join("\n"));
