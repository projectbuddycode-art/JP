import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { redact } from "@/lib/redact";
import type { SessionProfile } from "@/lib/auth/permissions";
import { isDemoAuthMode } from "@/lib/auth/demo-session";
import { getDemoStore } from "@/lib/demo/store";
import { demoCredentials } from "@/lib/auth/demo-session";

export type AuditInput = {
  actor?: SessionProfile | null;
  action: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  field?: string;
  previousValue?: string | null;
  newValue?: string | null;
  source?: "user" | "system" | "automation" | "integration";
  metadata?: Record<string, unknown>;
  correlationId?: string;
  automationExecutionId?: string;
  ip?: string;
  userAgent?: string;
};

export async function recordAudit(input: AuditInput) {
  const payload = {
    actor_id: input.actor?.id ?? null,
    actor_email: input.actor?.email ?? null,
    actor_name: input.actor?.full_name ?? null,
    actor_role: input.actor?.role ?? null,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    entity_name: input.entityName ?? null,
    field_name: input.field ?? null,
    previous_value: input.previousValue ?? null,
    new_value: input.newValue ?? null,
    source: input.source ?? "user",
    metadata: redact(input.metadata ?? {}),
    correlation_id: input.correlationId ?? null,
    automation_execution_id: input.automationExecutionId ?? null,
    ip_address: input.ip ?? null,
    user_agent: input.userAgent ?? null,
    created_at: new Date().toISOString(),
  };
  if (isDemoAuthMode()) {
    const store = getDemoStore(demoCredentials().email || "demo@local");
    store.audit_logs = store.audit_logs ?? [];
    store.audit_logs.unshift({
      id: crypto.randomUUID(),
      event_code: `AUD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 4)}`,
      ...payload,
    });
    return;
  }
  const admin = tryCreateAdminClient();
  if (!admin) return;
  await admin.from("audit_logs").insert(payload);
}
