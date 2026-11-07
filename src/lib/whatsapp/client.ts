import { createAdminClient } from "@/lib/supabase/admin";
import { canSendWhatsApp, isOptOutText } from "@/lib/whatsapp/eligibility";
import { logger } from "@/lib/logger";

type SecretPayload = {
  accessToken?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  wabaId?: string;
};

export async function getWhatsAppConnection() {
  const admin = createAdminClient();
  const { data: connection } = await admin
    .from("integration_connections")
    .select("*")
    .eq("provider", "whatsapp")
    .maybeSingle();
  const { data: secret } = await admin
    .from("integration_secrets")
    .select("payload")
    .eq("provider", "whatsapp")
    .maybeSingle();
  const payload = (secret?.payload ?? {}) as SecretPayload;
  const connected =
    connection?.status === "connected" &&
    Boolean(payload.accessToken && payload.phoneNumberId);
  return { connection, payload, connected };
}

export async function sendQueuedWhatsApp(input: Record<string, unknown>) {
  const { connected, payload } = await getWhatsAppConnection();
  const eligibility = canSendWhatsApp({
    connected,
    templateApproved: Boolean(input.templateApproved ?? true),
    messageKind: (input.messageKind as "session" | "template" | "marketing") ?? "session",
    consent: {
      marketingOptIn: Boolean(input.marketingOptIn),
      transactionalAllowed: Boolean(input.transactionalAllowed ?? true),
      suppressed: Boolean(input.suppressed),
    },
    window: { lastCustomerMessageAt: (input.lastCustomerMessageAt as string) ?? null },
    humanTakeover: Boolean(input.humanTakeover),
  });
  if (!eligibility.allowed) {
    return { sent: false, reason: eligibility.reason };
  }
  const to = String(input.to ?? "");
  const body = String(input.body ?? "");
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${payload.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${payload.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    },
  );
  const json = (await response.json()) as { messages?: Array<{ id: string }>; error?: { message: string } };
  if (!response.ok) {
    logger.error("whatsapp_send_failed", { status: response.status });
    throw new Error(json.error?.message ?? "WhatsApp send failed");
  }
  return { sent: true, providerMessageId: json.messages?.[0]?.id ?? null };
}

export async function recordInboundWhatsApp(input: {
  from: string;
  body: string;
  providerMessageId: string;
  timestamp?: string;
}) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("messages")
    .select("id")
    .eq("provider_message_id", input.providerMessageId)
    .maybeSingle();
  if (existing) return { duplicate: true };

  const { data: contact } = await admin
    .from("contacts")
    .select("id")
    .eq("phone_e164", input.from)
    .maybeSingle();

  let contactId = contact?.id;
  if (!contactId) {
    const { data: created, error } = await admin
      .from("contacts")
      .insert({ phone_e164: input.from, full_name: input.from, consent_transactional: true })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "Could not create WhatsApp contact");
    contactId = created.id;
  }

  let { data: conversation } = await admin
    .from("conversations")
    .select("*")
    .eq("contact_id", contactId)
    .eq("provider", "whatsapp")
    .maybeSingle();
  if (!conversation) {
    const { data: created } = await admin
      .from("conversations")
      .insert({
        contact_id: contactId,
        provider: "whatsapp",
        provider_thread_id: input.from,
        last_customer_message_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
        unread_count: 1,
      })
      .select("*")
      .single();
    conversation = created;
  } else {
    await admin
      .from("conversations")
      .update({
        last_customer_message_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
        unread_count: (conversation.unread_count ?? 0) + 1,
      })
      .eq("id", conversation.id);
  }

  await admin.from("messages").insert({
    conversation_id: conversation.id,
    provider_message_id: input.providerMessageId,
    direction: "inbound",
    status: "delivered",
    body: input.body,
  });

  const { looksLikeTravelEnquiry } = await import("@/lib/ingest/classify");
  if (looksLikeTravelEnquiry(input.body)) {
    const { ingestLead } = await import("@/lib/integrations/process");
    await ingestLead({
      provider: "whatsapp",
      eventId: input.providerMessageId,
      eventType: "whatsapp_enquiry",
      fullName: input.from,
      phone: input.from,
      source: "whatsapp",
      notes: input.body,
      payloadMinimized: { conversationId: conversation.id },
    });
  }

  if (isOptOutText(input.body)) {
    await admin.from("suppression_list").upsert({
      phone_e164: input.from,
      reason: "STOP keyword",
    });
    await admin.from("consent_records").insert({
      contact_id: contactId,
      channel: "whatsapp",
      kind: "marketing",
      granted: false,
      source: "inbound_keyword",
    });
    await admin.from("contacts").update({ consent_marketing: false }).eq("id", contactId);
  }

  return { duplicate: false, conversationId: conversation.id };
}
