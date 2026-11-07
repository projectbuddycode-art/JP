import type { NormalizedLeadEvent } from "@/lib/ingest/types";

export type LinkedInLeadPayload = {
  leadId?: string;
  id?: string;
  formId?: string;
  formUrn?: string;
  campaignId?: string;
  account?: string;
  organization?: string;
  submittedAt?: number | string;
  leadType?: string;
  fields?: Record<string, string | null>;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
};

export function mapLinkedInLead(payload: LinkedInLeadPayload): NormalizedLeadEvent | { error: string } {
  const leadId = payload.leadId || payload.id;
  if (!leadId) return { error: "LinkedIn lead id is required" };
  const fields = payload.fields ?? {};
  const first = payload.firstName || fields.firstName || fields.first_name || "";
  const last = payload.lastName || fields.lastName || fields.last_name || "";
  return {
    event_id: String(leadId),
    provider: "linkedin",
    source_type: "linkedin_lead_gen",
    provider_account_id: payload.account || payload.organization || null,
    provider_form_id: payload.formId || payload.formUrn || null,
    provider_lead_id: String(leadId),
    contact: {
      full_name: [first, last].filter(Boolean).join(" ") || fields.fullName || null,
      email: payload.email || fields.email || fields.emailAddress || null,
      phone: payload.phone || fields.phone || fields.phoneNumber || null,
    },
    attribution: {
      campaign_id: payload.campaignId || null,
      form_id: payload.formId || payload.formUrn || null,
    },
    submitted_at: payload.submittedAt ? new Date(payload.submittedAt).toISOString() : null,
    raw: payload,
    fields,
  };
}
