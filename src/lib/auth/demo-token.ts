import { createHmac, timingSafeEqual } from "crypto";

export const DEMO_COOKIE = "nr_demo_session";
export const DEMO_OWNER_ID = "00000000-0000-0000-0000-00000000d001";
export const DEMO_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

export function isDemoAuthEnabled() {
  return process.env.DEMO_MODE === "true";
}

export function demoSessionSecret() {
  return process.env.DEMO_SESSION_SECRET ?? "";
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

export function encodeDemoToken(subject: string, now = Date.now()) {
  const secret = demoSessionSecret();
  if (!secret) throw new Error("DEMO_SESSION_SECRET is not configured");
  const payload = Buffer.from(
    JSON.stringify({ sub: subject, exp: now + DEMO_SESSION_MAX_AGE_SECONDS * 1000 }),
    "utf8",
  ).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyDemoToken(token: string | undefined, now = Date.now()) {
  if (!isDemoAuthEnabled()) return null;
  const secret = demoSessionSecret();
  if (!token || !token.includes(".") || !secret) return null;
  const [payload, signature] = token.split(".");
  const expected = sign(payload, secret);
  if (!safeEqual(signature, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: string;
      email?: string;
      exp?: number;
    };
    const subject = data.sub || data.email;
    if (!subject || !data.exp || data.exp < now) return null;
    return subject;
  } catch {
    return null;
  }
}
