"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useIdentity } from "@/context/IdentityContext";

export function IdentityGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, configured, user, profile } = useIdentity();

  useEffect(() => {
    if (!ready || !configured) return;
    const onboarded = Boolean(profile?.onboarding_completed_at);

    if (user && !onboarded && pathname !== "/onboarding" && pathname !== "/verify") {
      if (
        pathname.startsWith("/home") ||
        pathname.startsWith("/profile") ||
        pathname.startsWith("/trust") ||
        pathname.startsWith("/people") ||
        pathname.startsWith("/campus") ||
        pathname.startsWith("/circles") ||
        pathname.startsWith("/dev/matching")
      ) {
        router.replace("/onboarding");
      }
    }

    if (user && onboarded && pathname === "/onboarding") {
      router.replace("/home");
    }
  }, [ready, configured, user, profile, pathname, router]);

  return <>{children}</>;
}
