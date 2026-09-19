import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublicEnv } from "./env";
import type { Database } from "./database.types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** Shared browser client — avoids multiple GoTrue instances racing refresh tokens. */
export function createClient() {
  if (browserClient) return browserClient;
  const { url, anonKey } = requireSupabasePublicEnv();
  browserClient = createBrowserClient<Database>(url, anonKey);
  return browserClient;
}
