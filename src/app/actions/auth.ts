"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient, tryCreateAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import { writeAudit } from "@/lib/audit";
import {
  clearDemoCookie,
  demoCredentials,
  isDemoAuthMode,
  setDemoCookie,
} from "@/lib/auth/demo-session";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type AuthFormState = { error: string | null; message?: string | null };

export async function signInAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password (8+ characters)." };
  if (isDemoAuthMode()) {
    const demo = demoCredentials();
    if (
      parsed.data.email.toLowerCase() === demo.email &&
      parsed.data.password === demo.password
    ) {
      await recordLoginEvent(parsed.data.email, true);
      await setDemoCookie(parsed.data.email.toLowerCase());
      redirect("/overview");
    }
    await recordLoginEvent(parsed.data.email, false);
    return { error: "Invalid demo email or password." };
  }
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Supabase is not configured yet." };
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  await recordLoginEvent(parsed.data.email, !error);
  if (error) return { error: error.message };
  redirect("/overview");
}

async function recordLoginEvent(email: string, success: boolean) {
  const admin = tryCreateAdminClient();
  if (!admin) return;
  await admin.from("login_events").insert({
    email: email.toLowerCase(),
    success,
    created_at: new Date().toISOString(),
  });
}

export async function signUpAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password (8+ characters)." };
  if (isDemoAuthMode()) {
    return signInAction(_state, formData);
  }
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
  const supabase = await createServerSupabase();
  await supabase?.auth.signOut();
  redirect("/login");
}

export async function resetPasswordAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
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
  redirect("/overview");
}

export async function inviteMemberAction(formData: FormData) {
  const { requireOwnerProfile } = await import("@/lib/auth/session");
  await requireOwnerProfile();
  const email = String(formData.get("email") ?? "").toLowerCase();
  if (!z.string().email().safeParse(email).success) throw new Error("Enter a valid email.");
  const admin = createAdminClient();
  const { error } = await admin.from("team_invites").insert({ email });
  if (error) throw new Error(error.message);
}
