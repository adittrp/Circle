import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { runRealMatch } from "@/lib/matching/service";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, onboarding_completed_at")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
  }

  let includeSynthetic: boolean | undefined;
  let dryRun = false;
  try {
    const body = (await request.json()) as {
      includeSynthetic?: boolean;
      dryRun?: boolean;
    };
    includeSynthetic = body.includeSynthetic;
    dryRun = Boolean(body.dryRun);
  } catch {
    // empty body is fine
  }

  try {
    const { result, circleId } = await runRealMatch(supabase, profile.id, {
      includeSynthetic,
      persist: !dryRun,
    });

    return NextResponse.json({
      circleId,
      why: result.why,
      groupSize: result.groupSize,
      score: result.score,
      usedSyntheticFill: result.usedSyntheticFill,
      companions: result.companions.map((c) => ({
        id: c.id,
        firstName: c.firstName,
        majorName: c.majorName,
        year: c.year,
        residenceName: c.residenceName,
        avatarUrl: c.avatarUrl,
        interestNames: c.interestNames,
        isSynthetic: c.isSynthetic,
      })),
      debug: dryRun
        ? {
            eligibleCount: result.eligibleCount,
            shortlistCount: result.shortlistCount,
            combinationsEvaluated: result.combinationsEvaluated,
            runtimeMs: result.runtimeMs,
            breakdown: result.breakdown,
            pairScores: result.pairScores.map((p) => ({
              id: p.candidate.id,
              name: p.candidate.firstName,
              score: p.score,
              breakdown: p.breakdown,
            })),
          }
        : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Matching failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
