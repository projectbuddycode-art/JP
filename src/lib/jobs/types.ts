export const JOB_TYPES = [
  "automation.execute",
  "social.publish",
  "whatsapp.send",
  "followup.scan",
  "metrics.sync",
  "integration.process",
  "report.generate",
] as const;

export type JobType = (typeof JOB_TYPES)[number];

export type JobRecord = {
  id: string;
  type: JobType;
  payload: Record<string, unknown>;
  run_at: string;
  status: "pending" | "running" | "succeeded" | "failed" | "cancelled";
  attempts: number;
  max_attempts: number;
  idempotency_key: string | null;
  last_error: string | null;
};
