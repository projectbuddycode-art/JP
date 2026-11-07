import { AUTOMATION_SCHEDULES, nextRunAt, scheduleByKey, scheduleWindowKey, type ScheduleDefinition } from "@/lib/automation/schedules";
import { enqueueJob } from "@/lib/jobs/queue";
import { processDueJobs } from "@/lib/jobs/processor";
import { logger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import type { JobType } from "@/lib/jobs/types";

export type TickPayload = {
  action?: string;
  scheduleKey?: string;
};

async function markSchedule(key: string, patch: Record<string, unknown>) {
  try {
    const admin = createAdminClient();
    await admin.from("automation_schedules").update(patch).eq("key", key);
  } catch {
    // Table may not exist until 0010 is applied. Jobs still enqueue.
  }
}

async function enqueueNamedSchedule(schedule: ScheduleDefinition, now: Date) {
  if (schedule.jobType === "jobs.process") {
    await markSchedule(schedule.key, {
      last_enqueued_at: now.toISOString(),
      last_error: null,
      next_run_at: nextRunAt(schedule.cadence, now).toISOString(),
    });
    return { key: schedule.key, enqueued: false, processedOnly: true };
  }
  const windowKey = scheduleWindowKey(schedule.cadence, now);
  const result = await enqueueJob({
    type: schedule.jobType as JobType,
    payload: { scheduleKey: schedule.key, windowKey, timezone: "Asia/Kolkata" },
    idempotencyKey: `${schedule.key}:${windowKey}`,
  });
  await markSchedule(schedule.key, {
    last_enqueued_at: now.toISOString(),
    last_error: null,
    next_run_at: nextRunAt(schedule.cadence, now).toISOString(),
  });
  return { key: schedule.key, enqueued: !result.duplicate, duplicate: result.duplicate };
}

async function loadDueSchedules() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("automation_schedules").select("key, enabled, next_run_at");
    if (error) return { rows: null as null | Array<{ key: string; enabled: boolean; next_run_at: string | null }> };
    return { rows: data ?? [] };
  } catch {
    return { rows: null as null | Array<{ key: string; enabled: boolean; next_run_at: string | null }> };
  }
}

export async function runAutomationTick(input: TickPayload = {}) {
  const now = new Date();
  const action = input.action ?? "process_due_jobs";

  if (action === "run_schedule") {
    const schedule = scheduleByKey(String(input.scheduleKey ?? ""));
    if (!schedule) {
      return { ok: false, error: "Unknown schedule key", processed: [] as unknown[] };
    }
    const queued = await enqueueNamedSchedule(schedule, now);
    const processed = await processDueJobs();
    await markSchedule(schedule.key, { last_success_at: new Date().toISOString(), last_error: null });
    return { ok: true, timezone: "Asia/Kolkata", queued, processed };
  }

  const { rows } = await loadDueSchedules();
  const queued = [];
  if (!rows) {
    for (const schedule of AUTOMATION_SCHEDULES) {
      queued.push(await enqueueNamedSchedule(schedule, now));
    }
  } else {
    for (const row of rows) {
      if (!row.enabled) continue;
      if (row.next_run_at && new Date(row.next_run_at).getTime() > now.getTime()) continue;
      const schedule = scheduleByKey(row.key);
      if (!schedule) continue;
      queued.push(await enqueueNamedSchedule(schedule, now));
    }
  }

  const processed = await processDueJobs();
  await markSchedule("jobs.process", {
    last_success_at: new Date().toISOString(),
    last_error: null,
    next_run_at: nextRunAt("every_5m", now).toISOString(),
  });
  logger.info("automation_tick", { queued: queued.length, processed: processed.length });
  return { ok: true, timezone: "Asia/Kolkata", queued, processed };
}
