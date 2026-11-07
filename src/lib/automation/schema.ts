import { z } from "zod";

export const TRIGGER_TYPES = [
  "lead_created",
  "lead_stage_changed",
  "lead_assigned",
  "follow_up_due",
  "no_response",
  "package_shared",
  "proposal_sent",
  "proposal_viewed",
  "booking_confirmed",
  "booking_cancelled",
  "travel_completed",
  "social_post_scheduled",
  "social_post_published",
  "social_post_failed",
  "whatsapp_inbound",
  "opt_out_received",
  "daily_scheduled",
] as const;

export const ACTION_TYPES = [
  "create_task",
  "assign_lead",
  "change_stage",
  "add_note",
  "notify_owner",
  "queue_whatsapp",
  "generate_draft",
  "share_package",
  "send_email",
  "schedule_reminder",
  "create_content_draft",
  "queue_content_approval",
  "pause_workflow",
  "call_webhook",
  "wait",
] as const;

export const conditionSchema = z.object({
  field: z.string().min(1),
  op: z.enum(["eq", "neq", "contains", "gt", "lt", "exists"]),
  value: z.unknown().optional(),
});

export const actionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(ACTION_TYPES),
  params: z.record(z.string(), z.unknown()).default({}),
  requiresApproval: z.boolean().default(false),
});

export const workflowDefinitionSchema = z.object({
  trigger: z.object({
    type: z.enum(TRIGGER_TYPES),
    params: z.record(z.string(), z.unknown()).default({}),
  }),
  conditions: z.array(conditionSchema).default([]),
  actions: z.array(actionSchema).min(1).max(25),
  timezone: z.string().default("Asia/Kolkata"),
  businessHoursOnly: z.boolean().default(false),
  maxAttempts: z.number().int().min(1).max(8).default(3),
});

export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;
