import { canonicalDomain, emailDomain } from "@/lib/auth/edu";
import type { University } from "@/lib/supabase/database.types";

export function matchUniversityByEmail(
  email: string,
  universities: University[],
  domains: { university_id: string; domain: string }[]
) {
  const raw = emailDomain(email);
  const canonical = canonicalDomain(raw);
  const hit =
    domains.find((d) => d.domain === raw) ??
    domains.find((d) => d.domain === canonical);
  if (!hit) return null;
  return universities.find((u) => u.id === hit.university_id) ?? null;
}
