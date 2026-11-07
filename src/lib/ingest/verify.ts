import { timingSafeEqual } from "crypto";
import { verifyHmacSha256 } from "@/lib/integrations/google-ads";

export function bearerMatches(header: string | null, expected: string | undefined) {
  if (!expected) return { ok: false, reason: "Webhook secret is not configured" };
  const token = header?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token) return { ok: false, reason: "Missing bearer token" };
  const left = Buffer.from(token);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return { ok: false, reason: "Invalid token" };
  if (!timingSafeEqual(left, right)) return { ok: false, reason: "Invalid token" };
  return { ok: true, reason: null };
}

export function hmacOrBearer(input: {
  raw: string;
  signatureHeader: string | null;
  authorization: string | null;
  secret?: string;
}) {
  if (!input.secret) return { ok: false, reason: "Webhook secret is not configured" };
  if (input.signatureHeader) {
    return verifyHmacSha256(input.raw, input.signatureHeader, input.secret)
      ? { ok: true, reason: null }
      : { ok: false, reason: "Invalid signature" };
  }
  return bearerMatches(input.authorization, input.secret);
}
