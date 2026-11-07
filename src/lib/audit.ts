import { recordAudit, type AuditInput } from "@/lib/audit/record";
import type { SessionProfile } from "@/lib/auth/permissions";

export async function writeAudit(
  input: AuditInput & {
    actorId?: string | null;
  },
) {
  const actor: SessionProfile | null =
    input.actor ??
    (input.actorId
      ? {
          id: input.actorId,
          email: "",
          full_name: null,
          role: "member",
          status: "active",
        }
      : null);
  await recordAudit({
    ...input,
    actor,
  });
}
