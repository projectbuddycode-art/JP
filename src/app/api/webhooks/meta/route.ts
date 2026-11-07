import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { verifyHmacSha256 } from "@/lib/integrations/google-ads";
import { ingestNormalizedLead } from "@/lib/ingest/engine";
import { applyMetaLeadFields, mapInstagramMessage, mapMetaLeadgenNotice } from "@/lib/ingest/adapters/meta";
import { classifyComment, commentCreatesLead, looksLikeTravelEnquiry } from "@/lib/ingest/classify";
import { fetchMetaLeadFields } from "@/lib/integrations/secrets";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === serverEnv().metaVerifyToken) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";
  const secret = serverEnv().metaAppSecret;
  if (!secret || !verifyHmacSha256(raw, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const body = JSON.parse(raw) as {
    object?: string;
    entry?: Array<{
      id?: string;
      changes?: Array<{ field?: string; value?: Record<string, unknown> }>;
      messaging?: Array<{
        sender?: { id?: string };
        timestamp?: number;
        message?: { mid?: string; text?: string };
      }>;
    }>;
  };

  const results: Array<{ event?: string; outcome?: string; error?: string }> = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      try {
        if (change.field === "leadgen") {
          const notice = mapMetaLeadgenNotice(change.value as { leadgen_id?: string }, entry.id);
          if ("error" in notice) {
            results.push({ error: notice.error });
            continue;
          }
          const retrieved = notice.provider_lead_id ? await fetchMetaLeadFields(notice.provider_lead_id) : { fields: [], error: null };
          const mapped = retrieved.fields.length ? applyMetaLeadFields(notice, retrieved.fields) : notice;
          const result = await ingestNormalizedLead(mapped);
          results.push({ event: notice.event_id, outcome: result.outcome });
        } else if (change.field === "comments") {
          const text = String((change.value as { text?: string }).text ?? "");
          const intent = classifyComment(text);
          const commentId = String((change.value as { id?: string }).id ?? crypto.randomUUID());
          const result = await ingestNormalizedLead({
            event_id: commentId,
            provider: "instagram_messaging",
            source_type: "instagram_comment",
            contact: { provider_user_id: String((change.value as { from?: { id?: string } }).from?.id ?? "") },
            trip: { notes: text, destination: intent === "destination_question" ? text : null },
            qualify_as_lead: commentCreatesLead(intent),
            raw: { intent, text },
          });
          results.push({ event: commentId, outcome: result.outcome });
        }
      } catch (error) {
        logger.error("meta_event_failed");
        results.push({ error: error instanceof Error ? error.message : "failed" });
      }
    }
    for (const message of entry.messaging ?? []) {
      try {
        const mid = message.message?.mid;
        if (!mid) continue;
        const mapped = mapInstagramMessage({
          mid,
          senderId: message.sender?.id ?? "unknown",
          text: message.message?.text,
          timestamp: message.timestamp,
          pageId: entry.id,
        });
        mapped.qualify_as_lead = looksLikeTravelEnquiry(message.message?.text);
        if (mapped.qualify_as_lead) {
          mapped.contact.full_name = mapped.contact.provider_user_id;
        }
        const result = await ingestNormalizedLead(mapped);
        results.push({ event: mid, outcome: result.outcome });
      } catch (error) {
        logger.error("ig_message_failed");
        results.push({ error: error instanceof Error ? error.message : "failed" });
      }
    }
  }
  return NextResponse.json({ ok: true, results });
}
