import { ingestNormalizedLead } from "@/lib/ingest/engine";
import { createAdminClient } from "@/lib/supabase/admin";
import type { IngestResult } from "@/lib/ingest/types";

export async function ingestLead(input: {
  provider: string;
  eventId: string;
  eventType: string;
  isTest?: boolean;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  destination?: string | null;
  source: string;
  campaignId?: string | null;
  formId?: string | null;
  adId?: string | null;
  clickId?: string | null;
  payloadMinimized?: Record<string, unknown>;
  packageId?: string | null;
  landingPage?: string | null;
  travellers?: number | null;
  preferredStart?: string | null;
  notes?: string | null;
  assignedOwnerId?: string | null;
  qualifyAsLead?: boolean;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
}): Promise<IngestResult> {
  return ingestNormalizedLead({
    event_id: input.eventId,
    provider: input.provider,
    source_type: input.eventType || input.source,
    provider_form_id: input.formId,
    provider_lead_id: input.eventId,
    contact: { full_name: input.fullName, email: input.email, phone: input.phone },
    trip: {
      destination: input.destination,
      travel_start_date: input.preferredStart,
      traveller_count: input.travellers,
      notes: input.notes,
      package_id: input.packageId,
    },
    attribution: {
      campaign_id: input.campaignId,
      ad_id: input.adId,
      form_id: input.formId,
      landing_page: input.landingPage,
      utm_source: input.utm?.source ?? input.source,
      utm_medium: input.utm?.medium,
      utm_campaign: input.utm?.campaign,
      utm_content: input.utm?.content,
      utm_term: input.utm?.term,
    },
    is_test: input.isTest,
    qualify_as_lead: input.qualifyAsLead,
    assigned_owner_id: input.assignedOwnerId,
    raw: input.payloadMinimized,
  });
}

export async function processIntegrationEvent(eventId: string) {
  const admin = createAdminClient();
  const { data: event } = await admin.from("integration_events").select("*").eq("id", eventId).maybeSingle();
  if (!event) throw new Error("Integration event not found");
  if (event.status === "processed") return { duplicate: true, outcome: "duplicate" as const };
  const payload = (event.payload_minimized ?? {}) as Record<string, unknown>;
  return ingestLead({
    provider: event.provider,
    eventId: event.event_id ?? event.id,
    eventType: event.event_type,
    isTest: Boolean(payload.isTest),
    fullName: (payload.fullName as string) ?? null,
    email: (payload.email as string) ?? null,
    phone: (payload.phone as string) ?? null,
    destination: (payload.destination as string) ?? null,
    source: (payload.source as string) ?? event.provider,
  });
}

export async function retryIntegrationEvent(eventRowId: string) {
  const admin = createAdminClient();
  const { data: event } = await admin.from("integration_events").select("*").eq("id", eventRowId).maybeSingle();
  if (!event) throw new Error("Event not found");
  if (event.outcome === "ignored") throw new Error("Ignored events are not retried");
  await admin.from("integration_events").update({ status: "received", outcome: null }).eq("id", eventRowId);
  return processIntegrationEvent(eventRowId);
}
