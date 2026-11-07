"use server";

import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import { ingestLead } from "@/lib/integrations/process";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { isPubliclyListed } from "@/lib/site/visibility";
import { enquirySchema, newsletterSchema } from "@/lib/site/enquiry";

export type EnquiryState = { error: string | null; ok: boolean };

export async function submitEnquiryAction(_state: EnquiryState, formData: FormData): Promise<EnquiryState> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "public-form";
  const limited = rateLimit(`enquiry:${ip}`, 8, 10 * 60_000);
  if (!limited.allowed) return { error: "Too many submissions. Please try later.", ok: false };
  const parsed = enquirySchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    email: formData.get("email") || "",
    destination: formData.get("destination") || "",
    preferred_start: formData.get("preferred_start") || "",
    travellers: formData.get("travellers") || undefined,
    budget_max: formData.get("budget_max") || undefined,
    consent: formData.get("consent"),
    utm_source: formData.get("utm_source") || "",
    utm_medium: formData.get("utm_medium") || "",
    utm_campaign: formData.get("utm_campaign") || "",
    utm_content: formData.get("utm_content") || "",
    utm_term: formData.get("utm_term") || "",
    package_id: formData.get("package_id") || "",
    trip_name: formData.get("trip_name") || "",
    trip_type: formData.get("trip_type") || "",
    notes: formData.get("notes") || "",
    landing_page: formData.get("landing_page") || "",
    flexible_dates: formData.get("flexible_dates") || "",
    communication_preference: formData.get("communication_preference") || "",
  });
  if (!parsed.success) {
    return { error: "Please complete name, phone, and consent.", ok: false };
  }

  let packageId = parsed.data.package_id || null;
  if (packageId) {
    const admin = tryCreateAdminClient();
    const { data: pack } = admin
      ? await admin.from("packages").select("id, status, website_status, destination, name").eq("id", packageId).maybeSingle()
      : { data: null };
    if (!pack || !isPubliclyListed(pack)) {
      return { error: "That trip is not available for public enquiry.", ok: false };
    }
    packageId = pack.id;
    parsed.data.destination = parsed.data.destination || pack.destination;
  }

  try {
    const result = await ingestLead({
      provider: "website_form",
      eventId: crypto.randomUUID(),
      eventType: "website_enquiry",
      fullName: parsed.data.full_name,
      email: parsed.data.email || null,
      phone: parsed.data.phone,
      destination: parsed.data.destination,
      source: parsed.data.utm_source || "website",
      packageId,
      landingPage: parsed.data.landing_page || null,
      travellers: parsed.data.travellers,
      preferredStart: parsed.data.preferred_start,
      notes: parsed.data.notes,
      utm: {
        source: parsed.data.utm_source || "website",
        medium: parsed.data.utm_medium || "site",
        campaign: parsed.data.utm_campaign,
        content: parsed.data.utm_content,
        term: parsed.data.utm_term,
      },
      payloadMinimized: {
        campaign: parsed.data.utm_campaign,
        travellers: parsed.data.travellers,
        budget: parsed.data.budget_max,
        tripType: parsed.data.trip_type,
        tripName: parsed.data.trip_name,
        flexible: Boolean(parsed.data.flexible_dates),
        communicationPreference: parsed.data.communication_preference,
        referrer: hdrs.get("referer"),
      },
    });
    const admin = tryCreateAdminClient();
    await admin?.from("website_events").insert({
      event_name: "enquiry_submitted",
      path: parsed.data.landing_page || "/enquire",
      package_id: packageId,
      destination_slug: parsed.data.destination,
      metadata: { leadId: result.leadId, duplicate: result.duplicate },
    });
    return { error: null, ok: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not submit enquiry",
      ok: false,
    };
  }
}

export async function trackSiteEventAction(formData: FormData) {
  const admin = tryCreateAdminClient();
  if (!admin) return;
  const name = String(formData.get("event_name") || "");
  if (!["whatsapp_click", "enquiry_started", "package_viewed", "newsletter_subscribed"].includes(name)) return;
  await admin.from("website_events").insert({
    event_name: name,
    path: String(formData.get("path") || ""),
    package_id: String(formData.get("package_id") || "") || null,
  });
}

export type NewsletterState = { error: string | null; ok: boolean };

export async function subscribeNewsletterAction(
  _state: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
    consent: formData.get("consent"),
  });
  if (!parsed.success) return { error: "Enter an email and consent to subscribe.", ok: false };
  const limited = rateLimit(`newsletter:${parsed.data.email}`, 4, 10 * 60_000);
  if (!limited.allowed) return { error: "Too many attempts. Try later.", ok: false };
  const admin = tryCreateAdminClient();
  if (!admin) return { error: "Could not store the subscription.", ok: false };
  await admin.from("website_events").insert({
    event_name: "newsletter_subscribed",
    path: "/footer",
    metadata: { email: parsed.data.email, consent: true, delivered: false },
  });
  return { error: null, ok: true };
}
