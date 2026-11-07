import { tryCreateAdminClient } from "@/lib/supabase/admin";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** In-process fallback only. Prefer enforceRateLimit so Vercel instances share Postgres state. */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (current.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  current.count += 1;
  return { allowed: true, remaining: limit - current.count };
}

export async function enforceRateLimit(key: string, limit: number, windowMs: number) {
  const admin = tryCreateAdminClient();
  if (admin) {
    const { data, error } = await admin.rpc("hit_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: Math.max(1, Math.round(windowMs / 1000)),
    });
    if (!error && typeof data === "boolean") {
      return { allowed: data, remaining: data ? 1 : 0 };
    }
  }
  return rateLimit(key, limit, windowMs);
}
