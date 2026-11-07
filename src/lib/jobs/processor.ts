import { createAdminClient } from "@/lib/supabase/admin";
import { claimJobs } from "@/lib/jobs/queue";
import { logger } from "@/lib/logger";
import { executeWorkflowJob } from "@/lib/automation/engine";
import { publishScheduledPost } from "@/lib/social/publish";
import { sendQueuedWhatsApp } from "@/lib/whatsapp/client";
import { scanFollowUps } from "@/lib/crm/followups";
import { processIntegrationEvent } from "@/lib/integrations/process";
import {
  alertUpcomingDepartures,
  generatePeriodReport,
  remindMissingDocuments,
  remindOutstandingPayments,
  remindUnconfirmedSuppliers,
} from "@/lib/automation/scans";

export async function processDueJobs() {
  const jobs = await claimJobs();
  const results = [];
  const admin = createAdminClient();
  for (const job of jobs) {
    try {
      await admin
        .from("jobs")
        .update({ attempts: (job.attempts ?? 0) + 1 })
        .eq("id", job.id);
      const result = await runJob(job.type, job.payload ?? {}, job.idempotency_key);
      await admin
        .from("jobs")
        .update({
          status: "succeeded",
          result,
          last_error: null,
        })
        .eq("id", job.id);
      results.push({ id: job.id, status: "succeeded" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown job error";
      logger.error("job_failed", { id: job.id, type: job.type, message });
      const attempts = (job.attempts ?? 0) + 1;
      const failed = attempts >= (job.max_attempts ?? 5);
      await admin
        .from("jobs")
        .update({
          status: failed ? "failed" : "pending",
          last_error: message,
          run_at: failed
            ? job.run_at
            : new Date(Date.now() + attempts * 60_000).toISOString(),
          locked_at: null,
          locked_by: null,
        })
        .eq("id", job.id);
      results.push({ id: job.id, status: failed ? "failed" : "retry" });
    }
  }
  return results;
}

async function runJob(
  type: string,
  payload: Record<string, unknown>,
  idempotencyKey: string | null,
) {
  switch (type) {
    case "automation.execute":
      return executeWorkflowJob(payload, idempotencyKey);
    case "social.publish":
      return publishScheduledPost(String(payload.postId));
    case "whatsapp.send":
      return sendQueuedWhatsApp(payload);
    case "followup.scan":
      return scanFollowUps();
    case "integration.process":
      return processIntegrationEvent(String(payload.eventId));
    case "report.daily":
      return generatePeriodReport("daily");
    case "report.weekly":
      return generatePeriodReport("weekly");
    case "report.monthly":
      return generatePeriodReport("monthly");
    case "payments.remind":
      return remindOutstandingPayments();
    case "departures.alert":
      return alertUpcomingDepartures();
    case "documents.remind":
      return remindMissingDocuments();
    case "suppliers.remind":
      return remindUnconfirmedSuppliers();
    case "jobs.process":
      return { skipped: true, reason: "Queue processing is handled by the authenticated tick endpoint" };
    case "report.generate":
      return generatePeriodReport("daily");
    default:
      throw new Error(`Unsupported job type: ${type}`);
  }
}
