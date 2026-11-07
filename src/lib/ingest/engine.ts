import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";
import { writeAudit } from "@/lib/audit";
import { pickAssignee } from "@/lib/assignment/engine";
import { dispatchTrigger } from "@/lib/automation/engine";
import { resolveContactMatch } from "@/lib/ingest/match";
import type { IngestResult, NormalizedLeadEvent } from "@/lib/ingest/types";
import { redact } from "@/lib/redact";
import { n8nConfig } from "@/lib/n8n/client";

const CONNECTION_PROVIDER: Record<string, string> = {
  meta: "meta_lead_ads",
  website_form: "website_form",
  google_ads: "google_ads",
  whatsapp: "whatsapp",
  linkedin: "linkedin",
  tiktok: "tiktok",
  email: "email",
  instagram_messaging: "instagram_messaging",
  custom_webhook: "custom_webhook",
  csv_import: "csv_import",
  manual: "website_form",
};

export async function ingestNormalizedLead(event: NormalizedLeadEvent): Promise<IngestResult> {
  const admin = createAdminClient();
  const phone = normalizePhone(event.contact.phone);
  const email = event.contact.email?.trim().toLowerCase() || null;

  const { data: existingEvent } = await admin
    .from("integration_events")
    .select("id, lead_id, status, contact_id")
    .eq("provider", event.provider)
    .eq("event_id", event.event_id)
    .maybeSingle();

  if (existingEvent?.status === "processed") {
    return {
      duplicate: true,
      leadId: existingEvent.lead_id,
      contactId: existingEvent.contact_id,
      eventRowId: existingEvent.id,
      outcome: "duplicate",
    };
  }

  const inserted = existingEvent
    ? existingEvent
    : (
        await admin
          .from("integration_events")
          .insert({
            provider: event.provider,
            event_id: event.event_id,
            event_type: event.source_type,
            source_type: event.source_type,
            status: "processing",
            qualify_as_lead: event.qualify_as_lead !== false,
            payload_minimized: redact({
              source_type: event.source_type,
              attribution: event.attribution,
              is_test: event.is_test,
              fields: event.fields,
            }),
          })
          .select("id, lead_id, status, contact_id")
          .single()
      ).data;

  if (!inserted) throw new Error("Could not record integration event");

  await admin.from("integration_event_attempts").insert({
    event_id: inserted.id,
    attempt_no: 1,
    status: "started",
    processing_step: "normalize",
  });

  if (event.qualify_as_lead === false) {
    await admin
      .from("integration_events")
      .update({ status: "processed", outcome: "ignored", processing_step: "not_a_lead", processed_at: new Date().toISOString() })
      .eq("id", inserted.id);
    return { duplicate: false, ignored: true, eventRowId: inserted.id, outcome: "ignored" };
  }

  const hasIdentity = Boolean(phone || email || event.contact.full_name);
  if (!hasIdentity) {
    await admin
      .from("integration_events")
      .update({
        status: "received",
        outcome: "pending_fields",
        processing_step: "awaiting_provider_fields",
      })
      .eq("id", inserted.id);
    return { duplicate: false, pendingFields: true, eventRowId: inserted.id, outcome: "pending_fields" };
  }

  const { data: contacts } = await admin.from("contacts").select("id, full_name, phone_e164, email").limit(2000);
  const resolved = resolveContactMatch({ phone, email, existing: contacts ?? [] });
  let contactId = resolved.contactId;
  if (!contactId) {
    const { data: created, error } = await admin
      .from("contacts")
      .insert({
        full_name: event.contact.full_name,
        phone_e164: phone,
        email,
        consent_marketing: Boolean(event.consent?.marketing_opt_in),
        consent_transactional: true,
      })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "Could not create contact");
    contactId = created.id;
  }

  if (event.consent?.marketing_opt_in != null) {
    await admin.from("consent_records").insert({
      contact_id: contactId,
      channel: event.provider,
      kind: "marketing",
      granted: event.consent.marketing_opt_in,
      source: event.consent.consent_source || event.source_type,
    });
  }

  const { data: stage } = await admin.from("lead_stages").select("id").eq("slug", "new_enquiry").maybeSingle();
  if (!stage) throw new Error("Default lead stage is missing");

  let ownerId = event.assigned_owner_id || null;
  if (!ownerId) {
    const { data: profiles } = await admin.from("profiles").select("id, workspace_role, status").eq("status", "active");
    const { data: openLeads } = await admin.from("leads").select("owner_id").is("archived_at", null).limit(500);
    const counts = new Map<string, number>();
    for (const row of openLeads ?? []) {
      if (row.owner_id) counts.set(row.owner_id, (counts.get(row.owner_id) ?? 0) + 1);
    }
    const partners = (profiles ?? [])
      .filter((item) => item.workspace_role === "partner" || item.workspace_role === "sales")
      .map((item) => ({
        id: item.id,
        activeLeadCount: counts.get(item.id) ?? 0,
        available: true,
        destinations: event.trip?.destination ? [event.trip.destination] : [],
      }));
    ownerId =
      pickAssignee("destination", partners, { destination: event.trip?.destination }) ??
      pickAssignee("workload", partners, {});
  }

  const { data: lead, error: leadError } = await admin
    .from("leads")
    .insert({
      contact_id: contactId,
      stage_id: stage.id,
      owner_id: ownerId,
      full_name: event.contact.full_name,
      phone_e164: phone,
      email,
      source: event.attribution?.utm_source || event.source_type,
      source_type: event.source_type,
      provider: event.provider,
      provider_account_id: event.provider_account_id,
      provider_lead_id: event.provider_lead_id,
      provider_event_id: event.event_id,
      source_record_id: event.event_id,
      destination: event.trip?.destination,
      form_id: event.attribution?.form_id || event.provider_form_id,
      ad_id: event.attribution?.ad_id,
      ad_set_id: event.attribution?.ad_set_id,
      campaign_name: event.attribution?.campaign_name,
      ad_name: event.attribution?.ad_name,
      landing_page: event.attribution?.landing_page,
      utm_source: event.attribution?.utm_source,
      utm_medium: event.attribution?.utm_medium,
      utm_campaign: event.attribution?.utm_campaign || event.attribution?.campaign_id,
      utm_content: event.attribution?.utm_content,
      utm_term: event.attribution?.utm_term,
      travellers: event.trip?.traveller_count,
      preferred_start: event.trip?.travel_start_date || null,
      preferred_end: event.trip?.travel_end_date || null,
      budget_max: event.trip?.budget,
      package_id: event.trip?.package_id,
      is_test: Boolean(event.is_test),
      needs_review: resolved.ambiguous,
      submitted_at: event.submitted_at || new Date().toISOString(),
      received_at: new Date().toISOString(),
      last_interaction_at: new Date().toISOString(),
      ingest_metadata: redact({ rawKeys: Object.keys(event.raw ?? {}), fields: event.fields }),
    })
    .select("id")
    .single();
  if (leadError || !lead) throw new Error(leadError?.message ?? "Could not create lead");

  await admin.from("activities").insert({
    lead_id: lead.id,
    contact_id: contactId,
    type: "lead_created",
    body: `Lead captured from ${event.source_type}`,
    metadata: { provider: event.provider, isTest: Boolean(event.is_test) },
  });
  await admin.from("trip_enquiries").insert({
    contact_id: contactId,
    lead_id: lead.id,
    package_id: event.trip?.package_id ?? null,
    destination: event.trip?.destination,
    start_date: event.trip?.travel_start_date || null,
    travellers: event.trip?.traveller_count ?? null,
    notes: event.trip?.notes ?? null,
  });
  await admin.from("tasks").insert({
    lead_id: lead.id,
    assigned_to: ownerId,
    title: "First response",
    type: "follow_up",
    status: "open",
    due_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  });
  await admin.from("lead_source_events").insert({
    lead_id: lead.id,
    contact_id: contactId,
    provider: event.provider,
    source_type: event.source_type,
    event_id: event.event_id,
    payload: redact(event.raw ?? {}),
  });
  await admin.from("campaign_attribution").insert({
    contact_id: contactId,
    lead_id: lead.id,
    touch: "latest",
    source: event.source_type,
  });
  if (event.fields) {
    const rows = Object.entries(event.fields).map(([field_name, field_value]) => ({
      lead_id: lead.id,
      field_name,
      field_value,
      source: event.provider,
    }));
    if (rows.length) await admin.from("lead_field_values").insert(rows);
  }

  await admin
    .from("integration_events")
    .update({
      status: "processed",
      outcome: "processed",
      processed_at: new Date().toISOString(),
      lead_id: lead.id,
      contact_id: contactId,
      attempt_count: 1,
      processing_step: "complete",
    })
    .eq("id", inserted.id);

  const connectionProvider = CONNECTION_PROVIDER[event.provider] ?? event.provider;
  if (event.provider === "website_form") {
    await admin
      .from("integration_connections")
      .update({
        status: "connected",
        last_success_at: new Date().toISOString(),
        last_lead_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("provider", connectionProvider);
  } else {
    await admin
      .from("integration_connections")
      .update({ last_lead_at: new Date().toISOString() })
      .eq("provider", connectionProvider);
  }

  await writeAudit({
    action: "lead_created",
    entityType: "leads",
    entityId: lead.id,
    entityName: event.contact.full_name ?? undefined,
    source: "integration",
    metadata: { provider: event.provider, source_type: event.source_type },
  });
  await dispatchTrigger("lead_created", {
    leadId: lead.id,
    contactId,
    source: event.source_type,
    eventId: event.event_id,
  });

  const n8n = n8nConfig();
  const hook = process.env.N8N_INGEST_WEBHOOK_URL; // server-only optional outbound; never exposed to the browser
  if (n8n.configured && hook?.startsWith("https://")) {
    fetch(hook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ leadId: lead.id, provider: event.provider, source_type: event.source_type }),
    }).catch(() => undefined);
  }

  return {
    duplicate: false,
    needsReview: resolved.ambiguous,
    leadId: lead.id,
    contactId,
    eventRowId: inserted.id,
    outcome: "processed",
  };
}
