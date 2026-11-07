import { hasPermission, normalizeRole, type Permission, type WorkspaceRole } from "@/lib/auth/rbac";

export type UserRole = "owner" | "member" | "admin" | "partner" | "sales" | "viewer" | "trip_leader" | "finance";
export type ProfileStatus = "active" | "invited" | "disabled";

export type SessionProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  workspace_role?: WorkspaceRole;
  status: ProfileStatus;
  must_change_password?: boolean;
};

export function profileRole(profile: SessionProfile | null): WorkspaceRole {
  return normalizeRole(profile?.workspace_role || profile?.role);
}

export function isActiveMember(profile: SessionProfile | null) {
  return Boolean(profile && profile.status === "active");
}

export function isOwner(profile: SessionProfile | null) {
  return Boolean(profile && profile.status === "active" && profileRole(profile) === "owner");
}

export function can(profile: SessionProfile | null, permission: Permission) {
  if (!isActiveMember(profile)) return false;
  return hasPermission(profileRole(profile), permission);
}

export function canManageIntegrations(profile: SessionProfile | null) {
  return can(profile, "integrations.manage");
}

export function canManageAutomations(profile: SessionProfile | null) {
  return can(profile, "automations.manage");
}

export function assertActive(profile: SessionProfile | null): SessionProfile {
  if (!isActiveMember(profile) || !profile) {
    throw new Error("You do not have access to this workspace");
  }
  return profile;
}

export function assertOwner(profile: SessionProfile | null): SessionProfile {
  const active = assertActive(profile);
  if (profileRole(active) !== "owner") {
    throw new Error("Only the workspace owner can perform this action");
  }
  return active;
}

export function assertPermission(profile: SessionProfile | null, permission: Permission) {
  const active = assertActive(profile);
  if (!can(active, permission)) {
    throw new Error("You do not have permission for this action");
  }
  return active;
}
