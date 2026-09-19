import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("get_my_active_circle");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return NextResponse.json({ circle: null });
  }

  return NextResponse.json({
    circle: {
      id: row.circle_id,
      universityId: row.university_id,
      stage: row.stage,
      formedAt: row.formed_at,
      whyTogether: row.why_together ?? [],
      matchScore: row.match_score,
      matchMeta: row.match_meta,
      members: row.members ?? [],
    },
  });
}
