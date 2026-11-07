import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { verifyHmacSha256 } from "@/lib/integrations/google-ads";
import { recordInboundWhatsApp } from "@/lib/whatsapp/client";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === serverEnv().whatsappVerifyToken) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";
  const secret = serverEnv().whatsappAppSecret;
  if (!secret || !verifyHmacSha256(raw, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const body = JSON.parse(raw) as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: Array<{ id: string; from: string; text?: { body?: string }; timestamp?: string }>;
          statuses?: Array<{ id: string; status: string }>;
        };
      }>;
    }>;
  };
  try {
    const admin = tryCreateAdminClient();
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const message of change.value?.messages ?? []) {
          await recordInboundWhatsApp({
            from: message.from.startsWith("+") ? message.from : `+${message.from}`,
            body: message.text?.body ?? "",
            providerMessageId: message.id,
            timestamp: message.timestamp,
          });
        }
        for (const status of change.value?.statuses ?? []) {
          await admin
            ?.from("messages")
            .update({ status: status.status })
            .eq("provider_message_id", status.id);
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("whatsapp_webhook_failed");
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
