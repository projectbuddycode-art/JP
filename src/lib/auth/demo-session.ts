import "server-only";
import { cookies } from "next/headers";
import {
  DEMO_COOKIE,
  DEMO_OWNER_ID,
  DEMO_SESSION_MAX_AGE_SECONDS,
  encodeDemoToken,
  isDemoAuthEnabled,
  safeEqual,
  verifyDemoToken,
} from "@/lib/auth/demo-token";

export { DEMO_COOKIE, DEMO_OWNER_ID, isDemoAuthEnabled as isDemoAuthMode, verifyDemoToken } from "@/lib/auth/demo-token";
export const DEMO_STORE_KEY = "jp-demo";

export function demoCredentials() {
  const username = (process.env.DEMO_USERNAME ?? process.env.DEMO_LOGIN_EMAIL ?? "").trim().toLowerCase();
  return {
    username,
    email: username.includes("@") ? username : `${username || "demo"}@demo.local`,
    password: process.env.DEMO_PASSWORD ?? process.env.DEMO_LOGIN_PASSWORD ?? "",
  };
}

export function demoConfigured() {
  const { username, password } = demoCredentials();
  return isDemoAuthEnabled() && Boolean(username && password && process.env.DEMO_SESSION_SECRET);
}

export function demoPasswordMatches(username: string, password: string) {
  const expected = demoCredentials();
  if (!expected.username || !expected.password) return false;
  const userOk = safeEqual(username.trim().toLowerCase(), expected.username);
  const passOk = safeEqual(password, expected.password);
  return userOk && passOk;
}

export async function setDemoCookie(subject: string) {
  const store = await cookies();
  const secure = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
  store.set(DEMO_COOKIE, encodeDemoToken(subject), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: DEMO_SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearDemoCookie() {
  const store = await cookies();
  store.delete(DEMO_COOKIE);
}

export async function readDemoEmail() {
  if (!isDemoAuthEnabled()) return null;
  const store = await cookies();
  return verifyDemoToken(store.get(DEMO_COOKIE)?.value);
}

export function demoProfile() {
  return {
    id: DEMO_OWNER_ID,
    email: demoCredentials().email,
    full_name: "JP Demo",
    role: "owner" as const,
    workspace_role: "owner" as const,
    status: "active" as const,
    must_change_password: false,
  };
}
