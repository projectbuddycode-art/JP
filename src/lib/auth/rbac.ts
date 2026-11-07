export const ROLES = ["owner", "admin", "partner", "sales", "viewer", "trip_leader", "finance"] as const;
export type WorkspaceRole = (typeof ROLES)[number];

export const PERMISSIONS = [
  "leads.view",
  "leads.create",
  "leads.edit",
  "leads.archive",
  "leads.assign",
  "leads.view_all",
  "leads.view_own",
  "revenue.view",
  "reports.financial",
  "records.export",
  "packages.manage",
  "bookings.manage",
  "integrations.manage",
  "automations.manage",
  "audit.view",
  "users.manage",
  "settings.manage",
  "content.publish",
  "operations.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  owner: [...PERMISSIONS],
  admin: PERMISSIONS.filter(
    (key) => !["users.manage", "settings.manage", "integrations.manage"].includes(key),
  ) as Permission[],
  partner: ["leads.view", "leads.view_own", "leads.edit", "leads.create", "bookings.manage"],
  sales: ["leads.view", "leads.view_own", "leads.edit", "leads.create"],
  viewer: ["leads.view", "leads.view_own"],
  trip_leader: ["leads.view", "leads.view_own", "bookings.manage", "operations.manage"],
  finance: ["leads.view", "revenue.view", "reports.financial", "bookings.manage", "records.export"],
};

export function normalizeRole(role: string | null | undefined): WorkspaceRole {
  if (
    role === "owner" ||
    role === "admin" ||
    role === "partner" ||
    role === "sales" ||
    role === "viewer" ||
    role === "trip_leader" ||
    role === "finance"
  ) {
    return role;
  }
  if (role === "member") return "sales";
  return "sales";
}

export function hasPermission(
  role: string | null | undefined,
  permission: Permission,
  overrides: Partial<Record<Permission, boolean>> = {},
) {
  if (permission in overrides) return Boolean(overrides[permission]);
  return ROLE_PERMISSIONS[normalizeRole(role)].includes(permission);
}

export function canViewLead(
  role: string | null | undefined,
  viewerId: string,
  ownerId: string | null,
) {
  if (hasPermission(role, "leads.view_all")) return true;
  if (hasPermission(role, "leads.view_own") && ownerId === viewerId) return true;
  return false;
}

export type NavItem = { href: string; label: string; group: "main" | "admin" };

export function navForRole(role: string | null | undefined): NavItem[] {
  const r = normalizeRole(role);
  const items: Array<NavItem & { show: boolean }> = [
    { href: "/overview", label: "Overview", group: "main", show: true },
    { href: "/sales", label: "Enquiries & Sales", group: "main", show: hasPermission(r, "leads.view") },
    { href: "/departures", label: "Trips & Departures", group: "main", show: hasPermission(r, "bookings.manage") || r === "trip_leader" || r === "admin" || r === "owner" },
    { href: "/travellers", label: "Travellers", group: "main", show: hasPermission(r, "bookings.manage") || r === "trip_leader" },
    { href: "/bookings", label: "Bookings & Payments", group: "main", show: hasPermission(r, "bookings.manage") || hasPermission(r, "revenue.view") },
    { href: "/operations", label: "Operations & Suppliers", group: "main", show: r === "owner" || r === "admin" || r === "trip_leader" || r === "finance" },
    { href: "/website", label: "Website & Marketing", group: "main", show: hasPermission(r, "content.publish") || r === "owner" || r === "admin" },
    { href: "/reports", label: "Reports", group: "admin", show: r === "owner" || r === "admin" || r === "finance" || r === "viewer" },
    { href: "/team", label: "Team & Partners", group: "admin", show: hasPermission(r, "users.manage") },
    { href: "/audit", label: "Audit History", group: "admin", show: hasPermission(r, "audit.view") },
    { href: "/automation", label: "Automation Center", group: "admin", show: hasPermission(r, "automations.manage") },
    { href: "/integrations", label: "Integrations", group: "admin", show: hasPermission(r, "integrations.manage") },
    { href: "/settings", label: "Settings", group: "admin", show: true },
  ];
  return items.filter((item) => item.show).map(({ show, ...item }) => {
    void show;
    return item;
  });
}
