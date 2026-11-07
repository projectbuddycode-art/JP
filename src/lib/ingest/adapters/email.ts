import type { NormalizedLeadEvent } from "@/lib/ingest/types";
import { looksLikeTravelEnquiry } from "@/lib/ingest/classify";

export type InboundEmailPayload = {
  messageId?: string;
  id?: string;
  from?: string;
  from_name?: string;
  subject?: string;
  text?: string;
  html?: string;
  receivedAt?: string;
  inReplyTo?: string | null;
  [key: string]: unknown;
};

export function mapInboundEmail(payload: InboundEmailPayload): NormalizedLeadEvent | { error: string } {
  const messageId = payload.messageId || payload.id;
  if (!messageId) return { error: "Email message id is required" };
  const from = String(payload.from || "");
  const email = from.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
  const body = String(payload.text || payload.html || "");
  const qualify = looksLikeTravelEnquiry(`${payload.subject ?? ""} ${body}`);
  return {
    event_id: String(messageId),
    provider: "email",
    source_type: "email_enquiry",
    provider_lead_id: String(messageId),
    contact: {
      full_name: payload.from_name || from.replace(/<.*?>/, "").trim() || null,
      email,
    },
    trip: { notes: [payload.subject, body.slice(0, 2000)].filter(Boolean).join("\n") },
    submitted_at: payload.receivedAt || null,
    qualify_as_lead: qualify && !payload.inReplyTo,
    raw: { subject: payload.subject, inReplyTo: payload.inReplyTo },
  };
}
