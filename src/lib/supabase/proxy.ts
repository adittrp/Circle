import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { isSupabaseConfigured } from "./env";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute =
    path.startsWith("/signin") ||
    path.startsWith("/signup") ||
    path.startsWith("/verify") ||
    path.startsWith("/auth");
  // Matching demo routes stay open so Path 2 is not blocked.
  const isProtected =
    path.startsWith("/onboarding") ||
    path.startsWith("/home") ||
    path.startsWith("/profile") ||
    path.startsWith("/circles");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && (isProtected || path === "/signin" || path === "/signup")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    const onboarded = Boolean(profile?.onboarding_completed_at);
    const destination = onboarded ? "/home" : "/onboarding";

    if (path === "/signin" || path === "/signup") {
      const url = request.nextUrl.clone();
      url.pathname = destination;
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (!onboarded && (path.startsWith("/home") || path.startsWith("/profile") || path.startsWith("/circles"))) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (onboarded && path.startsWith("/onboarding")) {
      const url = request.nextUrl.clone();
      url.pathname = "/home";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (!user && isAuthRoute) return response;

  return response;
}
