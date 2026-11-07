import { createHmac, timingSafeEqual } from "crypto";

export const DEMO_COOKIE = "nr_demo_session";

function secret() {
  return process.env.DEMO_SESSION_SECRET ?? "northridge-local-demo-secret";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function encodeDemoToken(email: string) {
  const payload = Buffer.from(
    JSON.stringify({ email, exp: Date.now() + 7 * 86_400_000 }),
    "utf8",
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyDemoToken(token: string | undefined) {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      email?: string;
      exp?: number;
    };
    if (!data.email || !data.exp || data.exp < Date.now()) return null;
    return data.email;
  } catch {
    return null;
  }
}
