import "server-only";
import { cookies } from "next/headers";
import { hasSupabasePublicConfig } from "@/lib/public-env";
import { DEMO_COOKIE, encodeDemoToken, verifyDemoToken } from "@/lib/auth/demo-token";

export { DEMO_COOKIE, verifyDemoToken } from "@/lib/auth/demo-token";
export const DEMO_OWNER_ID = "00000000-0000-0000-0000-00000000d001";

export function isDemoAuthMode() {
  return process.env.NODE_ENV !== "production" && !hasSupabasePublicConfig();
}

export function demoCredentials() {
  return {
    email: (process.env.DEMO_LOGIN_EMAIL ?? process.env.OWNER_BOOTSTRAP_EMAIL ?? "").toLowerCase(),
    password: process.env.DEMO_LOGIN_PASSWORD ?? "",
  };
}

export async function setDemoCookie(email: string) {
  const store = await cookies();
  store.set(DEMO_COOKIE, encodeDemoToken(email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearDemoCookie() {
  const store = await cookies();
  store.delete(DEMO_COOKIE);
}

export async function readDemoEmail() {
  if (!isDemoAuthMode()) return null;
  const store = await cookies();
  return verifyDemoToken(store.get(DEMO_COOKIE)?.value);
}

export function demoProfile(email: string) {
  return {
    id: DEMO_OWNER_ID,
    email,
    full_name: "Project Buddy",
    role: "owner" as const,
    workspace_role: "owner" as const,
    status: "active" as const,
    must_change_password: false,
  };
}
