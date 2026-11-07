import type { NormalizedLeadEvent } from "@/lib/ingest/types";

export type TikTokLeadPayload = {
  lead_id?: string;
  id?: string;
  campaign_id?: string;
  form_id?: string;
  advertiser_id?: string;
  create_time?: number | string;
  data?: Array<{ field_name?: string; field_value?: string; name?: string; value?: string }>;
  [key: string]: unknown;
};

function fieldsFrom(payload: TikTokLeadPayload) {
  const map: Record<string, string> = {};
  for (const row of payload.data ?? []) {
    const name = (row.field_name || row.name || "").toLowerCase();
    const value = row.field_value || row.value || "";
    if (name) map[name] = value;
  }
  return map;
}

export function mapTikTokLead(payload: TikTokLeadPayload): NormalizedLeadEvent | { error: string } {
  const leadId = payload.lead_id || payload.id;
  if (!leadId) return { error: "TikTok lead id is required" };
  const fields = fieldsFrom(payload);
  return {
    event_id: String(leadId),
    provider: "tiktok",
    source_type: "tiktok_lead_gen",
    provider_account_id: payload.advertiser_id || null,
    provider_form_id: payload.form_id || null,
    provider_lead_id: String(leadId),
    contact: {
      full_name: fields.name || fields.full_name || null,
      email: fields.email || null,
      phone: fields.phone || fields.phone_number || null,
    },
    trip: { destination: fields.destination || null },
    attribution: {
      campaign_id: payload.campaign_id || null,
      form_id: payload.form_id || null,
    },
    submitted_at: payload.create_time ? new Date(payload.create_time).toISOString() : null,
    raw: payload,
    fields,
  };
}
