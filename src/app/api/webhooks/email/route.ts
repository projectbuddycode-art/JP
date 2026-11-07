import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { hmacOrBearer } from "@/lib/ingest/verify";
import { mapInboundEmail } from "@/lib/ingest/adapters/email";
import { ingestNormalizedLead } from "@/lib/ingest/engine";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const raw = await request.text();
  const env = serverEnv();
  const check = hmacOrBearer({
    raw,
    signatureHeader: request.headers.get("svix-signature") ?? request.headers.get("x-resend-signature"),
    authorization: request.headers.get("authorization"),
    secret: env.resendWebhookSecret || env.ingestWebhookSecret,
  });
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
  try {
    const payload = JSON.parse(raw) as Parameters<typeof mapInboundEmail>[0];
    const mapped = mapInboundEmail(payload);
    if ("error" in mapped) return NextResponse.json({ error: mapped.error }, { status: 400 });
    const result = await ingestNormalizedLead(mapped);
    return NextResponse.json({ ok: true, outcome: result.outcome, leadId: result.leadId });
  } catch (error) {
    logger.error("email_ingest_failed");
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
