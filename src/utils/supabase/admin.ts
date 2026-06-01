import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase admin client (service role).
 * Used to create pre-confirmed users so the demo doesn't require email
 * confirmation. NEVER import this into client components.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase admin env vars (URL / SERVICE_ROLE_KEY) are not set");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
