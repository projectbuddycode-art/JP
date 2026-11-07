export type NormalizedContact = {
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  provider_user_id?: string | null;
};

export type NormalizedTrip = {
  destination?: string | null;
  travel_start_date?: string | null;
  travel_end_date?: string | null;
  traveller_count?: number | null;
  budget?: number | null;
  notes?: string | null;
  package_id?: string | null;
};

export type NormalizedAttribution = {
  campaign_id?: string | null;
  campaign_name?: string | null;
  ad_id?: string | null;
  ad_name?: string | null;
  ad_set_id?: string | null;
  form_id?: string | null;
  form_name?: string | null;
  landing_page?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
};

export type NormalizedConsent = {
  marketing_opt_in?: boolean | null;
  consent_source?: string | null;
  consent_timestamp?: string | null;
};

export type NormalizedLeadEvent = {
  event_id: string;
  provider: string;
  source_type: string;
  provider_account_id?: string | null;
  provider_form_id?: string | null;
  provider_lead_id?: string | null;
  contact: NormalizedContact;
  trip?: NormalizedTrip;
  attribution?: NormalizedAttribution;
  submitted_at?: string | null;
  consent?: NormalizedConsent;
  is_test?: boolean;
  qualify_as_lead?: boolean;
  assigned_owner_id?: string | null;
  raw?: Record<string, unknown>;
  fields?: Record<string, string | null>;
};

export type IngestResult = {
  duplicate: boolean;
  ignored?: boolean;
  pendingFields?: boolean;
  needsReview?: boolean;
  leadId?: string | null;
  contactId?: string | null;
  eventRowId?: string | null;
  outcome: "processed" | "duplicate" | "ignored" | "failed" | "pending_fields";
};
