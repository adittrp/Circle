import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json()) as { inviteeId?: string };
  if (!body.inviteeId) {
    return NextResponse.json({ error: "inviteeId required" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("invite_student_to_circle", {
    invitee_id: body.inviteeId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ circleId: data as string });
}
