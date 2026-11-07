import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { hmacOrBearer } from "@/lib/ingest/verify";
import { ingestNormalizedLead } from "@/lib/ingest/engine";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import type { NormalizedLeadEvent } from "@/lib/ingest/types";

export async function POST(request: Request) {
  const limited = await enforceRateLimit("custom-webhook", 60, 60_000);
  if (!limited.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  const raw = await request.text();
  const check = hmacOrBearer({
    raw,
    signatureHeader: request.headers.get("x-northridge-signature"),
    authorization: request.headers.get("authorization"),
    secret: serverEnv().ingestWebhookSecret,
  });
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
  try {
    const payload = JSON.parse(raw) as Partial<NormalizedLeadEvent> & { contact?: NormalizedLeadEvent["contact"] };
    if (!payload.event_id || !payload.contact) {
      return NextResponse.json({ error: "event_id and contact are required" }, { status: 400 });
    }
    const result = await ingestNormalizedLead({
      event_id: payload.event_id,
      provider: payload.provider || "custom_webhook",
      source_type: payload.source_type || "custom_api",
      provider_account_id: payload.provider_account_id,
      provider_form_id: payload.provider_form_id,
      provider_lead_id: payload.provider_lead_id || payload.event_id,
      contact: payload.contact,
      trip: payload.trip,
      attribution: payload.attribution,
      submitted_at: payload.submitted_at,
      consent: payload.consent,
      is_test: payload.is_test,
      raw: payload as Record<string, unknown>,
    });
    return NextResponse.json({ ok: true, outcome: result.outcome, leadId: result.leadId, duplicate: result.duplicate });
  } catch (error) {
    logger.error("custom_ingest_failed");
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
