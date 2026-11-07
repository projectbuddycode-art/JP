"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActiveProfile } from "@/lib/auth/session";
import { assertPermission } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/audit";
import { ROLES, type WorkspaceRole } from "@/lib/auth/rbac";
import { serverEnv } from "@/lib/env";

export async function inviteUserAction(formData: FormData) {
  const { profile } = await requireActiveProfile();
  assertPermission(profile, "users.manage");
  const email = String(formData.get("email") ?? "").toLowerCase();
  const workspaceRole = String(formData.get("workspace_role") || "partner") as WorkspaceRole;
  if (!z.string().email().safeParse(email).success) throw new Error("Enter a valid email.");
  if (!ROLES.includes(workspaceRole) || workspaceRole === "owner") {
    throw new Error("Choose a valid non-owner role.");
  }
  const admin = createAdminClient();
  const { error } = await admin.from("team_invites").insert({
    email,
    workspace_role: workspaceRole,
    invited_by: profile.id,
  });
  if (error) throw new Error(error.message);
  try {
    const invite = (
      admin as unknown as { auth: { admin?: { inviteUserByEmail: (email: string, opts: object) => Promise<unknown> } } }
    ).auth.admin?.inviteUserByEmail;
    if (invite) {
      await invite(email, {
        redirectTo: `${serverEnv().appUrl}/auth/callback?next=/overview`,
        data: { workspace_role: workspaceRole },
      });
    }
  } catch {
    // Demo mode and missing Auth Admin API still persist the invite row.
  }
  await writeAudit({
    actor: profile,
    action: "user_invited",
    entityType: "profiles",
    entityName: email,
    newValue: workspaceRole,
    source: "user",
  });
  revalidatePath("/team");
}

export async function updateUserRoleAction(formData: FormData) {
  const { profile } = await requireActiveProfile();
  assertPermission(profile, "users.manage");
  const userId = String(formData.get("user_id"));
  const workspaceRole = String(formData.get("workspace_role")) as WorkspaceRole;
  if (userId === profile.id) throw new Error("You cannot change your own role.");
  if (!ROLES.includes(workspaceRole)) throw new Error("Invalid role.");
  const admin = createAdminClient();
  const { data: previous } = await admin.from("profiles").select("workspace_role, email").eq("id", userId).single();
  const { error } = await admin
    .from("profiles")
    .update({ workspace_role: workspaceRole, role: workspaceRole === "owner" ? "owner" : "member" })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  await writeAudit({
    actor: profile,
    action: "user_role_changed",
    entityType: "profiles",
    entityId: userId,
    entityName: previous?.email,
    field: "workspace_role",
    previousValue: previous?.workspace_role,
    newValue: workspaceRole,
  });
  revalidatePath("/team");
}

export async function setUserStatusAction(formData: FormData) {
  const { profile } = await requireActiveProfile();
  assertPermission(profile, "users.manage");
  const userId = String(formData.get("user_id"));
  const status = String(formData.get("status"));
  if (userId === profile.id) throw new Error("You cannot disable your own account.");
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ status }).eq("id", userId);
  if (error) throw new Error(error.message);
  await writeAudit({
    actor: profile,
    action: status === "disabled" ? "user_disabled" : "user_activated",
    entityType: "profiles",
    entityId: userId,
    newValue: status,
  });
  revalidatePath("/team");
}

export async function changePasswordAction(formData: FormData) {
  const { supabase, profile, demo } = await requireActiveProfile();
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) throw new Error("Use a password with at least 10 characters.");
  if (demo) throw new Error("Password changes are not available in local demo mode.");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
  const admin = createAdminClient();
  await admin.from("profiles").update({ must_change_password: false }).eq("id", profile.id);
  await writeAudit({ actor: profile, action: "password_changed", entityType: "profiles", entityId: profile.id });
  revalidatePath("/settings");
}

export async function assignLeadAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  assertPermission(profile, "leads.assign");
  const leadId = String(formData.get("lead_id"));
  const ownerId = String(formData.get("owner_id"));
  const { data: lead } = await supabase.from("leads").select("id, owner_id, full_name").eq("id", leadId).single();
  if (!lead) throw new Error("Lead not found");
  const { error } = await supabase
    .from("leads")
    .update({ owner_id: ownerId, assigned_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) throw new Error(error.message);
  await supabase.from("lead_assignment_history").insert({
    lead_id: leadId,
    from_owner_id: lead.owner_id,
    to_owner_id: ownerId,
    assigned_by: profile.id,
    reason: String(formData.get("reason") || "manual"),
  });
  await writeAudit({
    actor: profile,
    action: "lead_reassigned",
    entityType: "leads",
    entityId: leadId,
    entityName: lead.full_name,
    field: "owner_id",
    previousValue: lead.owner_id,
    newValue: ownerId,
  });
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}
