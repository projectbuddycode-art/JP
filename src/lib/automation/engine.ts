import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateConditions, validateWorkflowGraph } from "@/lib/automation/validate";
import { enqueueJob } from "@/lib/jobs/queue";
import { canSendWhatsApp } from "@/lib/whatsapp/eligibility";
import type { WorkflowDefinition } from "@/lib/automation/schema";

export async function executeWorkflowJob(
  payload: Record<string, unknown>,
  idempotencyKey: string | null,
) {
  const admin = createAdminClient();
  const workflowId = String(payload.workflowId ?? "");
  const dryRun = Boolean(payload.dryRun);
  const { data: workflow } = await admin
    .from("automation_workflows")
    .select("*")
    .eq("id", workflowId)
    .maybeSingle();
  if (!workflow) throw new Error("Workflow not found");
  if (!workflow.enabled && !dryRun) {
    return { skipped: true, reason: "Workflow disabled" };
  }
  const parsed = validateWorkflowGraph(workflow.definition);
  if (!parsed.ok) throw new Error(parsed.errors.join("; "));
  const definition = parsed.definition;
  const context = (payload.context as Record<string, unknown>) ?? {};
  if (!evaluateConditions(definition.conditions, context)) {
    await admin.from("automation_executions").insert({
      workflow_id: workflowId,
      trigger_type: definition.trigger.type,
      status: "skipped",
      dry_run: dryRun,
      context,
      result: { reason: "conditions_not_met" },
      finished_at: new Date().toISOString(),
    });
    return { skipped: true, reason: "conditions_not_met" };
  }

  const steps = [];
  for (const action of definition.actions) {
    if (action.requiresApproval && !payload.approved) {
      steps.push({ action: action.type, status: "awaiting_approval" });
      continue;
    }
    if (dryRun) {
      steps.push({ action: action.type, status: "dry_run" });
      continue;
    }
    const result = await runAction(definition, action.type, action.params, context);
    steps.push(result);
  }

  await admin.from("automation_executions").insert({
    workflow_id: workflowId,
    trigger_type: definition.trigger.type,
    status: "succeeded",
    dry_run: dryRun,
    context,
    result: { steps, idempotencyKey },
    finished_at: new Date().toISOString(),
  });
  return { steps };
}

async function runAction(
  definition: WorkflowDefinition,
  type: string,
  params: Record<string, unknown>,
  context: Record<string, unknown>,
) {
  const admin = createAdminClient();
  switch (type) {
    case "wait": {
      const minutes = Number(params.minutes ?? 60);
      await enqueueJob({
        type: "automation.execute",
        payload: { workflowId: context.workflowId, context, resume: true },
        runAt: new Date(Date.now() + minutes * 60_000),
        idempotencyKey: `wait:${String(context.executionSeed ?? crypto.randomUUID())}:${type}`,
      });
      return { action: type, status: "scheduled" };
    }
    case "create_task":
      await admin.from("tasks").insert({
        lead_id: context.leadId ?? null,
        title: String(params.title ?? "Follow up"),
        type: String(params.taskType ?? "follow_up"),
        due_at: params.dueAt ?? new Date(Date.now() + 86_400_000).toISOString(),
      });
      return { action: type, status: "done" };
    case "add_note":
      await admin.from("activities").insert({
        lead_id: context.leadId ?? null,
        type: "note",
        body: String(params.body ?? "Automation note"),
      });
      return { action: type, status: "done" };
    case "notify_owner": {
      const { data: owner } = await admin
        .from("profiles")
        .select("id")
        .eq("role", "owner")
        .eq("status", "active")
        .maybeSingle();
      if (owner) {
        await admin.from("notifications").insert({
          profile_id: owner.id,
          title: String(params.title ?? "Automation alert"),
          body: String(params.body ?? "A workflow needs attention"),
          href: context.leadId ? `/leads/${context.leadId}` : "/automation",
        });
      }
      return { action: type, status: "done" };
    }
    case "queue_whatsapp": {
      const eligibility = canSendWhatsApp({
        connected: Boolean(context.whatsappConnected),
        templateApproved: Boolean(params.templateApproved),
        messageKind: (params.messageKind as "session" | "template" | "marketing") ?? "template",
        consent: {
          marketingOptIn: Boolean(context.marketingOptIn),
          transactionalAllowed: Boolean(context.transactionalAllowed ?? true),
          suppressed: Boolean(context.suppressed),
        },
        window: { lastCustomerMessageAt: (context.lastCustomerMessageAt as string) ?? null },
        humanTakeover: Boolean(context.humanTakeover),
      });
      if (!eligibility.allowed) {
        return { action: type, status: "blocked", reason: eligibility.reason };
      }
      await enqueueJob({
        type: "whatsapp.send",
        payload: { ...params, leadId: context.leadId, contactId: context.contactId },
        idempotencyKey: `wa:${String(context.leadId)}:${String(params.template ?? "msg")}`,
      });
      return { action: type, status: "queued" };
    }
    case "pause_workflow":
      await admin
        .from("automation_workflows")
        .update({ enabled: false })
        .eq("id", String(context.workflowId ?? ""));
      return { action: type, status: "done" };
    case "call_webhook": {
      const url = String(params.url ?? "");
      if (!url.startsWith("https://")) {
        return { action: type, status: "blocked", reason: "Webhook must be HTTPS" };
      }
      await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "northridge", context }),
      });
      return { action: type, status: "done" };
    }
    default:
      return { action: type, status: "recorded", note: "Action recorded with no external side effect" };
  }
}

export async function dispatchTrigger(type: string, context: Record<string, unknown>) {
  const admin = createAdminClient();
  const { data: workflows } = await admin
    .from("automation_workflows")
    .select("id, definition, enabled")
    .eq("enabled", true);
  for (const workflow of workflows ?? []) {
    const trigger = workflow.definition?.trigger?.type;
    if (trigger !== type) continue;
    await enqueueJob({
      type: "automation.execute",
      payload: { workflowId: workflow.id, context: { ...context, workflowId: workflow.id } },
      idempotencyKey: `${type}:${workflow.id}:${String(context.leadId ?? context.eventId ?? crypto.randomUUID())}`,
    });
  }
}
