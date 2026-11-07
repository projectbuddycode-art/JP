"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import { writeAudit } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  clearDemoCookie,
  demoConfigured,
  demoPasswordMatches,
  isDemoAuthMode,
  setDemoCookie,
} from "@/lib/auth/demo-session";

const productionCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type AuthFormState = { error: string | null; message?: string | null };

export async function signInAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "login";
  const limited = await enforceRateLimit(`demo-login:${ip}`, 8, 15 * 60_000);
  if (!limited.allowed) return { error: "Too many sign-in attempts. Try again later." };

  if (isDemoAuthMode()) {
    if (!demoConfigured()) {
      return { error: "Demo mode is enabled but DEMO_USERNAME, DEMO_PASSWORD, and DEMO_SESSION_SECRET are not all set." };
    }
    const username = String(formData.get("username") || formData.get("email") || "");
    const password = String(formData.get("password") || "");
    if (!demoPasswordMatches(username, password)) {
      return { error: "Invalid username or password." };
    }
    await setDemoCookie(username.trim().toLowerCase());
    redirect("/overview");
  }

  const parsed = productionCredentialsSchema.safeParse({
    email: formData.get("email") || formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password (8+ characters)." };
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Supabase is not configured yet." };
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  await recordLoginEvent(parsed.data.email, !error);
  if (error) return { error: error.message };
  redirect("/overview");
}

async function recordLoginEvent(email: string, success: boolean) {
  if (isDemoAuthMode()) return;
  const admin = tryCreateAdminClient();
  if (!admin) return;
  await admin.from("login_events").insert({
    email: email.toLowerCase(),
    success,
    created_at: new Date().toISOString(),
  });
}

export async function signUpAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (isDemoAuthMode()) {
    return { error: "Account creation is disabled in demonstration mode." };
  }
  const parsed = productionCredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password (8+ characters)." };
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Supabase is not configured yet." };
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${serverEnv().appUrl}/auth/callback` },
  });
  if (error) return { error: error.message };
  return { error: null, message: "Check your email to confirm the account, then sign in." };
}

export async function signOutAction() {
  await clearDemoCookie();
  if (!isDemoAuthMode()) {
    const supabase = await createServerSupabase();
    await supabase?.auth.signOut();
  }
  redirect("/login");
}

export async function resetPasswordAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (isDemoAuthMode()) {
    return { error: "Password reset is not available in demonstration mode." };
  }
  const email = String(formData.get("email") ?? "");
  if (!z.string().email().safeParse(email).success) {
    return { error: "Enter a valid email address." };
  }
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Supabase is not configured yet." };
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${serverEnv().appUrl}/auth/callback?next=/settings`,
  });
  if (error) return { error: error.message };
  return { error: null, message: "If an account exists, a recovery email has been sent." };
}

export async function claimOwnerAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (isDemoAuthMode()) {
    return { error: "Owner bootstrap is not used in demonstration mode." };
  }
  const secret = String(formData.get("secret") ?? "");
  const env = serverEnv();
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Supabase is not configured yet." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const emailOk = env.ownerBootstrapEmail && user.email?.toLowerCase() === env.ownerBootstrapEmail;
  const secretOk = env.ownerBootstrapSecret && secret === env.ownerBootstrapSecret;
  if (!emailOk && !secretOk) {
    return { error: "Owner bootstrap is not authorised. Check OWNER_BOOTSTRAP_SECRET or OWNER_BOOTSTRAP_EMAIL." };
  }
  const admin = tryCreateAdminClient();
  if (!admin) return { error: "Service role key is required to complete owner setup." };
  const { error } = await admin.rpc("claim_first_owner", { target_id: user.id });
  if (error) return { error: error.message };
  await writeAudit({ actorId: user.id, action: "owner_claimed", entityType: "profiles", entityId: user.id });
  return { error: null, message: "You are now the workspace owner." };
}

export async function inviteMemberAction(formData: FormData) {
  const { inviteUserAction } = await import("@/app/actions/team");
  return inviteUserAction(formData);
}

export async function resetDemoDataAction() {
  if (!isDemoAuthMode()) {
    throw new Error("Demo reset is only available when DEMO_MODE=true.");
  }
  const { resetDemoStore } = await import("@/lib/demo/store");
  resetDemoStore();
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/", "layout");
  redirect("/overview");
}
