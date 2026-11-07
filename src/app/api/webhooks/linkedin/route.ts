import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { hmacOrBearer } from "@/lib/ingest/verify";
import { mapLinkedInLead } from "@/lib/ingest/adapters/linkedin";
import { ingestNormalizedLead } from "@/lib/ingest/engine";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const raw = await request.text();
  const env = serverEnv();
  const check = hmacOrBearer({
    raw,
    signatureHeader: request.headers.get("x-li-signature") ?? request.headers.get("x-linkedin-signature"),
    authorization: request.headers.get("authorization"),
    secret: env.linkedinWebhookSecret,
  });
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
  if (!env.linkedinClientId) {
    return NextResponse.json(
      { error: "Developer access required — awaiting LinkedIn Lead Sync approval." },
      { status: 409 },
    );
  }
  try {
    const payload = JSON.parse(raw) as Parameters<typeof mapLinkedInLead>[0];
    const mapped = mapLinkedInLead(payload);
    if ("error" in mapped) return NextResponse.json({ error: mapped.error }, { status: 400 });
    const result = await ingestNormalizedLead(mapped);
    return NextResponse.json({ ok: true, duplicate: result.duplicate, leadId: result.leadId });
  } catch (error) {
    logger.error("linkedin_ingest_failed");
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
