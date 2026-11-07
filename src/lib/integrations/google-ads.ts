import { createHmac, timingSafeEqual } from "crypto";

export type GoogleAdsLeadPayload = {
  lead_id?: string;
  is_test?: boolean;
  campaign_id?: string;
  ad_group_id?: string;
  creative_id?: string;
  gcl_id?: string;
  form_id?: string;
  google_key?: string;
  user_column_data?: Array<{ column_id?: string; string_value?: string }>;
  [key: string]: unknown;
};

export function extractGoogleLeadFields(payload: GoogleAdsLeadPayload) {
  const columns = new Map<string, string>();
  for (const column of payload.user_column_data ?? []) {
    if (column.column_id && column.string_value) {
      columns.set(column.column_id.toUpperCase(), column.string_value);
    }
  }
  return {
    providerLeadId: payload.lead_id ?? null,
    isTest: Boolean(payload.is_test),
    campaignId: payload.campaign_id ?? null,
    adGroupId: payload.ad_group_id ?? null,
    creativeId: payload.creative_id ?? null,
    formId: payload.form_id ?? null,
    gclid: payload.gcl_id ?? null,
    fullName:
      columns.get("FULL_NAME") ??
      [columns.get("FIRST_NAME"), columns.get("LAST_NAME")].filter(Boolean).join(" "),
    email: columns.get("EMAIL") ?? null,
    phone: columns.get("PHONE_NUMBER") ?? columns.get("PHONE") ?? null,
  };
}

export function verifyGoogleAdsKey(
  provided: string | undefined,
  expected: string | undefined,
) {
  if (!expected) return { ok: false, reason: "Google Ads webhook key is not configured" };
  if (!provided) return { ok: false, reason: "Missing google_key" };
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return { ok: false, reason: "Invalid google_key" };
  if (!timingSafeEqual(left, right)) return { ok: false, reason: "Invalid google_key" };
  return { ok: true, reason: null };
}

export function verifyHmacSha256(rawBody: string, signature: string, secret: string) {
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(digest);
  const received = Buffer.from(signature.replace(/^sha256=/, ""));
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
