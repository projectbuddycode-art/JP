import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { SessionProfile } from "@/lib/auth/permissions";
import {
  demoProfile,
  isDemoAuthMode,
  readDemoEmail,
} from "@/lib/auth/demo-session";
import { createDemoClient } from "@/lib/demo/client";

export async function getSessionUser() {
  if (isDemoAuthMode()) {
    const email = await readDemoEmail();
    if (!email) return { supabase: null, user: null, profile: null, demo: true as const };
    const supabase = createDemoClient(email) as unknown as NonNullable<
      Awaited<ReturnType<typeof createServerSupabase>>
    >;
    return {
      supabase,
      user: { id: demoProfile(email).id, email },
      profile: demoProfile(email),
      demo: true as const,
    };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { supabase: null, user: null, profile: null, demo: false as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null, demo: false as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, workspace_role, status, must_change_password")
    .eq("id", user.id)
    .maybeSingle();
  return {
    supabase,
    user,
    profile: (profile as SessionProfile | null) ?? null,
    demo: false as const,
  };
}

export async function requireUser() {
  const session = await getSessionUser();
  if (!session.supabase || !session.user) redirect("/login");
  return session as typeof session & { supabase: NonNullable<typeof session.supabase> };
}

export async function requireActiveProfile() {
  const session = await requireUser();
  if (!session.profile || session.profile.status !== "active") {
    redirect("/setup");
  }
  return session as typeof session & { profile: SessionProfile };
}

export async function requirePermission(permission: import("@/lib/auth/rbac").Permission) {
  const session = await requireActiveProfile();
  const { assertPermission } = await import("@/lib/auth/permissions");
  assertPermission(session.profile, permission);
  return session;
}

export async function requireOwnerProfile() {
  const session = await requireActiveProfile();
  const { profileRole } = await import("@/lib/auth/permissions");
  if (profileRole(session.profile) !== "owner") {
    redirect("/overview");
  }
  return session;
}
