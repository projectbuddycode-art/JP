import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/public-env";
import { requireServiceRole } from "@/lib/env";
import { isDemoAuthMode, demoCredentials } from "@/lib/auth/demo-session";
import { createDemoClient } from "@/lib/demo/client";

export function createAdminClient() {
  if (isDemoAuthMode()) {
    return createDemoClient(demoCredentials().email) as unknown as ReturnType<typeof createClient>;
  }
  const { supabaseUrl } = publicEnv();
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }
  return createClient(supabaseUrl, requireServiceRole(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function tryCreateAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}
