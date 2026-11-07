import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { requireActiveProfile } from "@/lib/auth/session";
import { navForRole } from "@/lib/auth/rbac";
import { profileRole } from "@/lib/auth/permissions";

export const instant = false;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, profile, demo } = await requireActiveProfile();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profile.id)
    .is("read_at", null);
  return (
    <AppShell
      profileName={profile.full_name || profile.email}
      notificationCount={count ?? 0}
      navItems={navForRole(profileRole(profile))}
    >
      {demo ? (
        <div className="mb-4 rounded-md border border-warm/40 bg-amber-50 px-4 py-2 text-sm">
          Local demo workspace — records are labelled sample data and reset when the server restarts. Integrations are not connected.
        </div>
      ) : null}
      {children}
    </AppShell>
  );
}
