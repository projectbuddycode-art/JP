"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerProfile } from "@/lib/auth/session";
import { listN8nWorkflows, setN8nWorkflowActive, testN8nConnection } from "@/lib/n8n/client";
import { writeAudit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";

export async function testN8nAction() {
  const { profile } = await requireOwnerProfile();
  const result = await testN8nConnection();
  await writeAudit({
    actor: profile,
    action: "n8n_connection_tested",
    entityType: "integrations",
    newValue: result.ok ? "ok" : result.error,
    source: "user",
  });
  const admin = createAdminClient();
  await admin
    .from("integration_connections")
    .update({
      status: result.ok ? "connected" : "error",
      last_success_at: result.ok ? new Date().toISOString() : null,
      last_error: result.ok ? null : result.error,
    })
    .eq("provider", "n8n");
  if (!result.ok) throw new Error(result.error ?? "n8n test failed");
  revalidatePath("/automation");
}

export async function toggleN8nWorkflowAction(id: string, active: boolean) {
  const { profile } = await requireOwnerProfile();
  await setN8nWorkflowActive(id, active);
  await writeAudit({
    actor: profile,
    action: active ? "n8n_workflow_enabled" : "n8n_workflow_paused",
    entityType: "automation_workflows",
    entityId: id,
  });
  revalidatePath("/automation");
}

export async function loadN8nWorkflowsAction() {
  await requireOwnerProfile();
  return listN8nWorkflows();
}
