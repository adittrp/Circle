import { writeFileSync } from "node:fs";
import { INTEREST_SEED, TEXAS_UNIVERSITIES } from "../src/data/texasUniversities";

function lit(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

const rest = TEXAS_UNIVERSITIES.filter((u) => u.slug !== "ut-austin");
const statements: string[] = [];

for (const uni of rest) {
  statements.push(`
insert into public.universities (slug, name, abbreviation, city, primary_color, secondary_color, logo_path)
values (${lit(uni.slug)}, ${lit(uni.name)}, ${lit(uni.abbreviation)}, ${lit(uni.city)}, ${lit(uni.primaryColor)}, ${lit(uni.secondaryColor)}, ${lit(uni.logoPath)})
on conflict (slug) do update set
  name = excluded.name, abbreviation = excluded.abbreviation, city = excluded.city,
  primary_color = excluded.primary_color, secondary_color = excluded.secondary_color, logo_path = excluded.logo_path;

insert into public.university_email_domains (university_id, domain)
select id, d from public.universities, unnest(ARRAY[${uni.domains.map((d) => lit(d.toLowerCase())).join(",")}]) as d
where slug = ${lit(uni.slug)}
on conflict (domain) do nothing;

insert into public.majors (university_id, name)
select id, m from public.universities, unnest(ARRAY[${uni.majors.map(lit).join(",")}]) as m
where slug = ${lit(uni.slug)}
on conflict (university_id, name) do nothing;

insert into public.residence_halls (university_id, name, is_off_campus, data_status)
select u.id, x.name, x.off, x.status
from public.universities u,
lateral (values ${uni.residenceHalls
    .map((h) => `(${lit(h.name)}, ${h.isOffCampus ? "true" : "false"}, '${h.dataStatus}'::public.data_status)`)
    .join(",")}) as x(name, off, status)
where u.slug = ${lit(uni.slug)}
on conflict (university_id, name) do update set is_off_campus = excluded.is_off_campus, data_status = excluded.data_status;

insert into public.campus_locations (university_id, name, category, data_status)
select u.id, x.name, x.category, x.status
from public.universities u,
lateral (values ${uni.locations
    .map((l) => `(${lit(l.name)}, '${l.category}'::public.location_category, '${l.dataStatus}'::public.data_status)`)
    .join(",")}) as x(name, category, status)
where u.slug = ${lit(uni.slug)}
on conflict (university_id, name) do update set category = excluded.category, data_status = excluded.data_status;
`);
}

statements.push(`
insert into public.interests (slug, name, category) values
${INTEREST_SEED.map((i) => `(${lit(i.slug)}, ${lit(i.name)}, ${lit(i.category)})`).join(",\n")}
on conflict (slug) do update set name = excluded.name, category = excluded.category;
`);

writeFileSync("/tmp/rest-campus.sql", statements.join("\n"));
console.log("wrote", statements.join("\n").length);
