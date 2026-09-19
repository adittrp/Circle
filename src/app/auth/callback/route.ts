import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Exchange the magic-link PKCE code / OTP token_hash on the server.
 * A client page here used to remount under React Strict Mode and burn the
 * one-time code on the second attempt, leaving people stuck on an error screen.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const token_hash =
    url.searchParams.get("token_hash") ?? url.searchParams.get("token");
  const type = (url.searchParams.get("type") ?? "email") as EmailOtpType;
  const next = url.searchParams.get("next") ?? "/onboarding";
  const destinationPath = next.startsWith("/") ? next : "/onboarding";
  const destination = new URL(destinationPath, url.origin);
  const errorUrl = new URL("/signin", url.origin);

  if (!code && !token_hash) {
    // Hash tokens never reach the server. Return a tiny document (don't redirect)
    // so the browser keeps #access_token=... and forwards it to the client finisher.
    const nextParam = destinationPath !== "/onboarding" ? `?next=${encodeURIComponent(destinationPath)}` : "";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Signing you in…</title></head><body><p>Signing you in…</p><script>
      var hash = location.hash || "";
      location.replace("/auth/continue${nextParam}" + hash);
    </script></body></html>`;
    return new NextResponse(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const supabase = await createServerSupabaseClient();

  if (token_hash) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (error) {
      errorUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(errorUrl);
    }
    return NextResponse.redirect(destination);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code!);
  if (error) {
    errorUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.redirect(destination);
}
