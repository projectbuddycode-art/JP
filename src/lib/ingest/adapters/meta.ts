import type { NormalizedLeadEvent } from "@/lib/ingest/types";

export type MetaLeadgenChange = {
  leadgen_id?: string;
  form_id?: string;
  page_id?: string;
  ad_id?: string;
  adgroup_id?: string;
  campaign_id?: string;
  created_time?: number;
};

export function mapMetaLeadgenNotice(change: MetaLeadgenChange, pageId?: string): NormalizedLeadEvent | { error: string } {
  if (!change.leadgen_id) return { error: "leadgen_id required" };
  return {
    event_id: change.leadgen_id,
    provider: "meta",
    source_type: "facebook_lead_ads",
    provider_account_id: change.page_id || pageId || null,
    provider_form_id: change.form_id || null,
    provider_lead_id: change.leadgen_id,
    contact: {},
    attribution: {
      campaign_id: change.campaign_id || null,
      ad_id: change.ad_id || null,
      ad_set_id: change.adgroup_id || null,
      form_id: change.form_id || null,
    },
    submitted_at: change.created_time ? new Date(change.created_time * 1000).toISOString() : null,
    raw: change as Record<string, unknown>,
  };
}

export function applyMetaLeadFields(
  event: NormalizedLeadEvent,
  fieldData: Array<{ name?: string; values?: string[] }>,
): NormalizedLeadEvent {
  const fields: Record<string, string | null> = { ...(event.fields ?? {}) };
  for (const field of fieldData) {
    if (!field.name) continue;
    fields[field.name] = field.values?.[0] ?? null;
  }
  const fullName =
    fields.full_name ||
    [fields.first_name, fields.last_name].filter(Boolean).join(" ") ||
    event.contact.full_name;
  return {
    ...event,
    contact: {
      ...event.contact,
      full_name: fullName,
      email: fields.email || event.contact.email,
      phone: fields.phone_number || fields.phone || event.contact.phone,
    },
    trip: {
      ...event.trip,
      destination: fields.destination || event.trip?.destination,
      traveller_count: fields.travellers ? Number(fields.travellers) : event.trip?.traveller_count,
    },
    fields,
  };
}

export function mapInstagramMessage(input: {
  mid: string;
  senderId: string;
  text?: string;
  timestamp?: number;
  pageId?: string;
}): NormalizedLeadEvent {
  return {
    event_id: input.mid,
    provider: "instagram_messaging",
    source_type: "instagram_dm",
    provider_account_id: input.pageId || null,
    provider_lead_id: input.senderId,
    contact: { provider_user_id: input.senderId, full_name: null },
    trip: { notes: input.text },
    submitted_at: input.timestamp ? new Date(input.timestamp).toISOString() : null,
    qualify_as_lead: false,
    raw: { text: input.text },
  };
}
