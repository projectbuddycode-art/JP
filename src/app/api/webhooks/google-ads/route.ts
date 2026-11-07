import { NextResponse } from "next/server";
import { extractGoogleLeadFields, verifyGoogleAdsKey, type GoogleAdsLeadPayload } from "@/lib/integrations/google-ads";
import { ingestLead } from "@/lib/integrations/process";
import { serverEnv } from "@/lib/env";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const payload = (await request.json()) as GoogleAdsLeadPayload;
  const envKey = serverEnv().googleAdsWebhookKey;
  const admin = tryCreateAdminClient();
  const { data: secret } = admin
    ? await admin.from("integration_secrets").select("payload").eq("provider", "google_ads").maybeSingle()
    : { data: null };
  const stored = (secret?.payload as { webhookKey?: string } | null)?.webhookKey;
  const check = verifyGoogleAdsKey(payload.google_key, stored || envKey);
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 401 });
  }
  const fields = extractGoogleLeadFields(payload);
  if (!fields.providerLeadId) {
    return NextResponse.json({ error: "lead_id required" }, { status: 400 });
  }
  try {
    const result = await ingestLead({
      provider: "google_ads",
      eventId: fields.providerLeadId,
      eventType: fields.isTest ? "google_ads_test" : "google_ads_lead",
      isTest: fields.isTest,
      fullName: fields.fullName,
      email: fields.email,
      phone: fields.phone,
      source: "google_ads",
      campaignId: fields.campaignId,
      formId: fields.formId,
      adId: fields.creativeId,
      clickId: fields.gclid,
      payloadMinimized: {
        campaignId: fields.campaignId,
        formId: fields.formId,
        isTest: fields.isTest,
      },
    });
    return NextResponse.json({ ok: true, duplicate: result.duplicate, test: fields.isTest });
  } catch (error) {
    logger.error("google_ads_ingest_failed");
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
