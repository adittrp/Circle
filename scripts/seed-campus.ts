import { INTEREST_SEED, TEXAS_UNIVERSITIES } from "../src/data/texasUniversities";
import { requireServiceClient } from "./supabaseAdmin";

async function main() {
  const supabase = requireServiceClient();

  for (const uni of TEXAS_UNIVERSITIES) {
    const { data: university, error: uniError } = await supabase
      .from("universities")
      .upsert(
        {
          slug: uni.slug,
          name: uni.name,
          abbreviation: uni.abbreviation,
          city: uni.city,
          primary_color: uni.primaryColor,
          secondary_color: uni.secondaryColor,
          logo_path: uni.logoPath,
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (uniError || !university) {
      throw uniError ?? new Error(`Failed to upsert ${uni.slug}`);
    }

    for (const domain of uni.domains) {
      const { error } = await supabase.from("university_email_domains").upsert(
        { university_id: university.id, domain: domain.toLowerCase() },
        { onConflict: "domain" }
      );
      if (error) throw error;
    }

    for (const name of uni.majors) {
      const { error } = await supabase
        .from("majors")
        .upsert({ university_id: university.id, name }, { onConflict: "university_id,name" });
      if (error) throw error;
    }

    for (const hall of uni.residenceHalls) {
      const { error } = await supabase.from("residence_halls").upsert(
        {
          university_id: university.id,
          name: hall.name,
          is_off_campus: Boolean(hall.isOffCampus),
          data_status: hall.dataStatus,
        },
        { onConflict: "university_id,name" }
      );
      if (error) throw error;
    }

    for (const loc of uni.locations) {
      const { error } = await supabase.from("campus_locations").upsert(
        {
          university_id: university.id,
          name: loc.name,
          category: loc.category,
          data_status: loc.dataStatus,
        },
        { onConflict: "university_id,name" }
      );
      if (error) throw error;
    }

    console.log(`Seeded ${uni.name}`);
  }

  for (const interest of INTEREST_SEED) {
    const { error } = await supabase
      .from("interests")
      .upsert(interest, { onConflict: "slug" });
    if (error) throw error;
  }

  console.log(`Seeded ${INTEREST_SEED.length} interests`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
