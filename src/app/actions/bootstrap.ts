"use server";

import { redirect } from "next/navigation";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import { writeAudit } from "@/lib/audit";
import { isDemoAuthMode } from "@/lib/auth/demo-session";

export type BootstrapState = { error: string | null; message?: string | null };

export async function bootstrapInitialOwnerAction(
  previous: BootstrapState,
  formData?: FormData,
): Promise<BootstrapState> {
  void previous;
  void formData;
  if (isDemoAuthMode()) {
    return { error: "Local demo mode already has an owner account. Bootstrap is only for Supabase deployments." };
  }
  const env = serverEnv();
  const email = env.bootstrapAdminEmail;
  const password = env.bootstrapAdminPassword;
  if (!email || !password) {
    return {
      error:
        "Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD on the server, then retry. Credentials are never accepted from the browser.",
    };
  }
  const admin = tryCreateAdminClient();
  if (!admin) return { error: "SUPABASE_SERVICE_ROLE_KEY is required for owner bootstrap." };

  const { data: state } = await admin.from("bootstrap_state").select("locked, completed_at").eq("id", 1).maybeSingle();
  if (state?.locked || state?.completed_at) {
    return { error: "Owner bootstrap is locked. The initial owner already exists." };
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { must_change_password: true },
  });
  if (error && !/already been registered|already exists/i.test(error.message)) {
    return { error: error.message };
  }

  const userId = created?.user?.id;
  const { data: existing } = userId
    ? { data: { id: userId } }
    : await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  const profileId = userId ?? existing?.id;
  if (!profileId) return { error: "Could not resolve the bootstrap user id." };

  await admin.from("profiles").upsert({
    id: profileId,
    email,
    full_name: "Workspace owner",
    role: "owner",
    workspace_role: "owner",
    status: "active",
    must_change_password: true,
  });
  await admin.from("workspace_settings").update({ bootstrap_completed_at: new Date().toISOString() }).neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("bootstrap_state").upsert({
    id: 1,
    locked: true,
    completed_at: new Date().toISOString(),
  });
  await writeAudit({
    actorId: profileId,
    action: "owner_bootstrapped",
    entityType: "profiles",
    entityId: profileId,
    source: "system",
  });
  redirect("/login");
}
