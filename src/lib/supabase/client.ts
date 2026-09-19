import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublicEnv } from "./env";
import type { Database } from "./database.types";

export function createClient() {
  const { url, anonKey } = requireSupabasePublicEnv();
  return createBrowserClient<Database>(url, anonKey);
}
