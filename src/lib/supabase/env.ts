export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, anonKey };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabasePublicEnv();
  return Boolean(
    url &&
      anonKey &&
      !url.includes("YOUR_PROJECT") &&
      anonKey !== "your_anon_key"
  );
}

export function requireSupabasePublicEnv() {
  const { url, anonKey } = getSupabasePublicEnv();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return { url, anonKey };
}
