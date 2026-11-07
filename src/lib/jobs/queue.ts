import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { JobType } from "@/lib/jobs/types";

export async function enqueueJob(input: {
  type: JobType;
  payload?: Record<string, unknown>;
  runAt?: Date;
  idempotencyKey?: string;
  maxAttempts?: number;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("jobs")
    .insert({
      type: input.type,
      payload: input.payload ?? {},
      run_at: (input.runAt ?? new Date()).toISOString(),
      idempotency_key: input.idempotencyKey ?? null,
      max_attempts: input.maxAttempts ?? 5,
    })
    .select("id")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") return { id: null, duplicate: true };
    throw error;
  }
  return { id: data?.id ?? null, duplicate: false };
}

export async function claimJobs(limit = 10, workerId = "northridge") {
  const admin = createAdminClient();
  const { data: pending } = await admin
    .from("jobs")
    .select("id")
    .eq("status", "pending")
    .lte("run_at", new Date().toISOString())
    .order("run_at", { ascending: true })
    .limit(limit);

  const claimed = [];
  for (const row of pending ?? []) {
    const { data } = await admin
      .from("jobs")
      .update({
        status: "running",
        locked_at: new Date().toISOString(),
        locked_by: workerId,
      })
      .eq("id", row.id)
      .eq("status", "pending")
      .select("*")
      .maybeSingle();
    if (data) claimed.push(data);
  }
  return claimed;
}
