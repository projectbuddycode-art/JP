import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { hmacOrBearer } from "@/lib/ingest/verify";
import { mapTikTokLead } from "@/lib/ingest/adapters/tiktok";
import { ingestNormalizedLead } from "@/lib/ingest/engine";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const raw = await request.text();
  const env = serverEnv();
  const check = hmacOrBearer({
    raw,
    signatureHeader: request.headers.get("x-tiktok-signature"),
    authorization: request.headers.get("authorization"),
    secret: env.tiktokAppSecret || env.tiktokWebhookToken,
  });
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
  try {
    const payload = JSON.parse(raw) as Parameters<typeof mapTikTokLead>[0];
    const mapped = mapTikTokLead(payload);
    if ("error" in mapped) return NextResponse.json({ error: mapped.error }, { status: 400 });
    const result = await ingestNormalizedLead(mapped);
    return NextResponse.json({ ok: true, duplicate: result.duplicate, leadId: result.leadId });
  } catch (error) {
    logger.error("tiktok_ingest_failed");
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
