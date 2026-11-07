"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActiveProfile, requireOwnerProfile } from "@/lib/auth/session";
import { assertPermission, can } from "@/lib/auth/permissions";
import { dispatchTrigger } from "@/lib/automation/engine";
import { writeAudit } from "@/lib/audit";
import { enqueueJob } from "@/lib/jobs/queue";
import { slugify } from "@/lib/utils";

const leadSchema = z.object({
  full_name: z.string().trim().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  destination: z.string().optional(),
  source: z.string().optional(),
  travellers: z.coerce.number().int().positive().optional(),
  budget_max: z.coerce.number().optional(),
  preferred_start: z.string().optional(),
  preferred_end: z.string().optional(),
  notes: z.string().optional(),
  consent_marketing: z.coerce.boolean().optional(),
});

export async function createLeadAction(formData: FormData) {
  const { profile } = await requireActiveProfile();
  assertPermission(profile, "leads.create");
  const parsed = leadSchema.parse({
    full_name: formData.get("full_name") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    destination: formData.get("destination") || undefined,
    source: formData.get("source") || "manual",
    travellers: formData.get("travellers") || undefined,
    budget_max: formData.get("budget_max") || undefined,
    preferred_start: formData.get("preferred_start") || undefined,
    preferred_end: formData.get("preferred_end") || undefined,
    notes: formData.get("notes") || undefined,
    consent_marketing: formData.get("consent_marketing") === "on",
  });
  const { ingestLead } = await import("@/lib/integrations/process");
  await ingestLead({
    provider: "manual",
    eventId: `manual:${crypto.randomUUID()}`,
    eventType: parsed.source || "manual",
    fullName: parsed.full_name,
    email: parsed.email?.toLowerCase() || null,
    phone: parsed.phone,
    destination: parsed.destination,
    source: parsed.source || "manual",
    travellers: parsed.travellers,
    preferredStart: parsed.preferred_start,
    notes: parsed.notes,
    assignedOwnerId: profile.id,
  });
  revalidatePath("/leads");
  revalidatePath("/sales");
}

export async function updateLeadStageAction(leadId: string, stageId: string) {
  const { supabase, profile } = await requireActiveProfile();
  assertPermission(profile, "leads.edit");
  const { data: lead } = await supabase
    .from("leads")
    .select("id, stage_id, lost_reason, destination, preferred_start, travellers, full_name")
    .eq("id", leadId)
    .single();
  if (!lead) throw new Error("Lead not found");
  const { data: stage } = await supabase.from("lead_stages").select("*").eq("id", stageId).single();
  if (!stage) throw new Error("Stage not found");
  for (const field of stage.required_fields ?? []) {
    if (!(lead as Record<string, unknown>)[field]) {
      throw new Error(`Stage "${stage.name}" requires ${field}`);
    }
  }
  const { error } = await supabase
    .from("leads")
    .update({ stage_id: stageId, last_interaction_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) throw new Error(error.message);
  await supabase.from("lead_stage_history").insert({
    lead_id: leadId,
    from_stage_id: lead.stage_id,
    to_stage_id: stageId,
    changed_by: profile.id,
  });
  await supabase.from("activities").insert({
    lead_id: leadId,
    actor_id: profile.id,
    type: "stage_changed",
    body: `Moved to ${stage.name}`,
  });
  await dispatchTrigger("lead_stage_changed", { leadId, stage: stage.slug });
  if (stage.is_won) {
    await dispatchTrigger("booking_confirmed", { leadId });
  }
  await writeAudit({
    actor: profile,
    action: "lead_stage_updated",
    entityType: "leads",
    entityId: leadId,
    entityName: lead.full_name,
    field: "stage_id",
    previousValue: lead.stage_id,
    newValue: stageId,
  });
  revalidatePath("/pipeline");
  revalidatePath("/leads");
}

export async function addNoteAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  const leadId = String(formData.get("lead_id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Note cannot be empty");
  await supabase.from("activities").insert({
    lead_id: leadId,
    actor_id: profile.id,
    type: "note",
    body,
  });
  await supabase.from("leads").update({ last_interaction_at: new Date().toISOString() }).eq("id", leadId);
  revalidatePath(`/leads/${leadId}`);
}

export async function createTaskAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  const leadId = String(formData.get("lead_id") || "");
  const title = String(formData.get("title") ?? "").trim();
  const dueAt = String(formData.get("due_at") || "");
  if (!title) throw new Error("Task title is required");
  await supabase.from("tasks").insert({
    lead_id: leadId || null,
    title,
    type: String(formData.get("type") || "follow_up"),
    due_at: dueAt || null,
    assigned_to: profile.id,
  });
  if (leadId && dueAt) {
    await supabase.from("leads").update({ next_follow_up_at: dueAt }).eq("id", leadId);
  }
  revalidatePath("/overview");
}

export async function completeTaskAction(taskId: string) {
  const { supabase } = await requireActiveProfile();
  await supabase
    .from("tasks")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", taskId);
  revalidatePath("/overview");
}

export async function savePackageAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  assertPermission(profile, "packages.manage");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Package name is required");
  const payload = {
    name,
    slug: slugify(String(formData.get("slug") || name)),
    destination: String(formData.get("destination") || ""),
    region: String(formData.get("region") || ""),
    short_description: String(formData.get("short_description") || ""),
    long_description: String(formData.get("long_description") || ""),
    duration_days: Number(formData.get("duration_days") || 0) || null,
    price_per_person: Number(formData.get("price_per_person") || 0) || null,
    inclusions: String(formData.get("inclusions") || ""),
    exclusions: String(formData.get("exclusions") || ""),
    status: String(formData.get("status") || "draft"),
  };
  if (payload.status === "published" && !can(profile, "content.publish")) {
    throw new Error("Only authorised publishers can list a trip on the public website.");
  }
  const id = String(formData.get("id") || "");
  if (id) {
    const { data: previous } = await supabase.from("packages").select("price_per_person, name").eq("id", id).single();
    const { error } = await supabase.from("packages").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
    if (previous && String(previous.price_per_person) !== String(payload.price_per_person)) {
      await writeAudit({
        actor: profile,
        action: "package_price_changed",
        entityType: "packages",
        entityId: id,
        entityName: previous.name,
        field: "price_per_person",
        previousValue: String(previous.price_per_person ?? ""),
        newValue: String(payload.price_per_person ?? ""),
      });
    }
  } else {
    const { error } = await supabase.from("packages").insert(payload);
    if (error) throw new Error(error.message);
    await writeAudit({ actor: profile, action: "package_created", entityType: "packages", entityName: name });
  }
  revalidatePath("/packages");
}

export async function clonePackageAction(packageId: string) {
  const { supabase } = await requireActiveProfile();
  const { data: pack } = await supabase.from("packages").select("*").eq("id", packageId).single();
  if (!pack) throw new Error("Package not found");
  const copy = {
    name: `${pack.name} (copy)`,
    slug: `${pack.slug}-copy-${Date.now()}`,
    destination: pack.destination,
    region: pack.region,
    short_description: pack.short_description,
    long_description: pack.long_description,
    duration_days: pack.duration_days,
    itinerary: pack.itinerary,
    best_season: pack.best_season,
    departure_points: pack.departure_points,
    group_size: pack.group_size,
    price_per_person: pack.price_per_person,
    currency: pack.currency,
    inclusions: pack.inclusions,
    exclusions: pack.exclusions,
    accommodation: pack.accommodation,
    transport: pack.transport,
    difficulty: pack.difficulty,
    suitability: pack.suitability,
    faqs: pack.faqs,
    travel_notes: pack.travel_notes,
    terms: pack.terms,
    cancellation_policy: pack.cancellation_policy,
    status: "draft",
  };
  const { error } = await supabase.from("packages").insert(copy);
  if (error) throw new Error(error.message);
  revalidatePath("/packages");
}

export async function createProposalAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  const leadId = String(formData.get("lead_id"));
  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).single();
  if (!lead) throw new Error("Lead not found");
  const token = crypto.randomUUID().replace(/-/g, "");
  const { error } = await supabase
    .from("proposals")
    .insert({
      lead_id: leadId,
      contact_id: lead.contact_id,
      package_id: formData.get("package_id") || null,
      public_token: token,
      title: String(formData.get("title") || `Proposal for ${lead.full_name ?? "traveller"}`),
      body_markdown: String(formData.get("body") || ""),
      amount: Number(formData.get("amount") || lead.estimated_value || 0) || null,
      created_by: profile.id,
      expires_at: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    })
    .select("id, public_token")
    .single();
  if (error) throw new Error(error.message);
  await supabase.from("activities").insert({
    lead_id: leadId,
    actor_id: profile.id,
    type: "proposal_created",
    body: "Proposal drafted",
  });
  revalidatePath(`/leads/${leadId}`);
}

export async function markProposalSentAction(proposalId: string) {
  const { supabase } = await requireActiveProfile();
  await supabase
    .from("proposals")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", proposalId);
  const { data: proposal } = await supabase.from("proposals").select("lead_id").eq("id", proposalId).single();
  if (proposal) {
    await dispatchTrigger("proposal_sent", { leadId: proposal.lead_id, proposalId });
    await supabase.from("tasks").insert({
      lead_id: proposal.lead_id,
      title: "Follow up after proposal",
      type: "follow_up",
      due_at: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    });
  }
  revalidatePath("/pipeline");
}

export async function convertProposalToBookingAction(proposalId: string) {
  const { supabase, profile } = await requireActiveProfile();
  const { data: proposal } = await supabase.from("proposals").select("*").eq("id", proposalId).single();
  if (!proposal) throw new Error("Proposal not found");
  if (proposal.status !== "accepted") {
    throw new Error("Booking conversion requires an accepted proposal");
  }
  const reference = `NR-${Date.now().toString(36).toUpperCase()}`;
  const { error } = await supabase.from("bookings").insert({
    contact_id: proposal.contact_id,
    lead_id: proposal.lead_id,
    package_id: proposal.package_id,
    booking_reference: reference,
    confirmed_amount: proposal.amount,
    quoted_amount: proposal.amount,
    booking_status: "confirmed",
    payment_status: "unpaid",
  });
  if (error) throw new Error(error.message);
  await writeAudit({
    actorId: profile.id,
    action: "booking_confirmed",
    entityType: "proposals",
    entityId: proposalId,
  });
  revalidatePath("/bookings");
}

export async function confirmBookingAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  const leadId = String(formData.get("lead_id"));
  const amount = Number(formData.get("confirmed_amount"));
  if (!amount) throw new Error("Confirmed amount is required to confirm a booking");
  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).single();
  if (!lead) throw new Error("Lead not found");
  const { error } = await supabase.from("bookings").insert({
    contact_id: lead.contact_id,
    lead_id: leadId,
    package_id: String(formData.get("package_id") || "") || null,
    departure_id: String(formData.get("departure_id") || "") || null,
    booking_reference: `NR-${Date.now().toString(36).toUpperCase()}`,
    travel_start: lead.preferred_start,
    travel_end: lead.preferred_end,
    travellers: lead.travellers,
    confirmed_amount: amount,
    booking_status: "confirmed",
    payment_status: String(formData.get("payment_status") || "unpaid"),
    amount_paid: 0,
    amount_received: 0,
  });
  if (error) throw new Error(error.message);
  const { data: won } = await supabase.from("lead_stages").select("id").eq("slug", "confirmed_booking").single();
  if (won) await updateLeadStageAction(leadId, won.id);
  await writeAudit({ actorId: profile.id, action: "booking_confirmed", entityType: "leads", entityId: leadId });
  revalidatePath("/bookings");
}

export async function saveWorkflowAction(formData: FormData) {
  const { supabase, profile } = await requireOwnerProfile();
  const definition = JSON.parse(String(formData.get("definition") || "{}"));
  const { validateWorkflowGraph } = await import("@/lib/automation/validate");
  const parsed = validateWorkflowGraph(definition);
  if (!parsed.ok) throw new Error(parsed.errors.join("; "));
  const { error } = await supabase.from("automation_workflows").insert({
    name: String(formData.get("name") || "Untitled workflow"),
    description: String(formData.get("description") || ""),
    enabled: formData.get("enabled") === "on",
    definition: parsed.definition,
  });
  if (error) throw new Error(error.message);
  await writeAudit({
    actor: profile,
    action: "automation_created",
    entityType: "automation_workflows",
    entityName: String(formData.get("name") || "Untitled workflow"),
  });
  revalidatePath("/automation");
}

export async function toggleWorkflowAction(id: string, enabled: boolean) {
  const { supabase, profile } = await requireOwnerProfile();
  await supabase.from("automation_workflows").update({ enabled }).eq("id", id);
  await writeAudit({
    actor: profile,
    action: enabled ? "automation_enabled" : "automation_disabled",
    entityType: "automation_workflows",
    entityId: id,
    newValue: String(enabled),
  });
  revalidatePath("/automation");
}

export async function testWorkflowAction(id: string) {
  await requireOwnerProfile();
  await enqueueJob({
    type: "automation.execute",
    payload: { workflowId: id, dryRun: true, context: { dryRun: true } },
    idempotencyKey: `test:${id}:${Date.now()}`,
  });
  revalidatePath("/automation");
}

export async function saveSocialPostAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  const platforms = String(formData.get("platforms") || "instagram,facebook")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const { data: post, error } = await supabase
    .from("social_posts")
    .insert({
      title: String(formData.get("title") || ""),
      caption: String(formData.get("caption") || ""),
      theme: String(formData.get("theme") || ""),
      destination: String(formData.get("destination") || ""),
      hashtags: String(formData.get("hashtags") || ""),
      cta: String(formData.get("cta") || ""),
      status: formData.get("scheduled_for") ? "scheduled" : "draft",
      scheduled_for: formData.get("scheduled_for") || null,
      timezone: String(formData.get("timezone") || "Asia/Kolkata"),
      created_by: profile.id,
    })
    .select("id, scheduled_for")
    .single();
  if (error || !post) throw new Error(error?.message ?? "Could not save post");
  await supabase.from("social_post_platforms").insert(
    platforms.map((platform) => ({
      post_id: post.id,
      platform,
      status: post.scheduled_for ? "scheduled" : "draft",
    })),
  );
  if (post.scheduled_for) {
    await enqueueJob({
      type: "social.publish",
      payload: { postId: post.id },
      runAt: new Date(post.scheduled_for),
      idempotencyKey: `social:${post.id}`,
    });
  }
  revalidatePath("/social");
}

export async function generateCaptionAction(formData: FormData) {
  await requireActiveProfile();
  const { generateCopy } = await import("@/lib/ai/provider");
  const theme = String(formData.get("theme") || "destination guide");
  const destination = String(formData.get("destination") || "Spiti Valley");
  await generateCopy(
    `Write an editable Instagram caption and 8 hashtags for a ${theme} about ${destination}. Do not invent prices, permits, or testimonials.`,
  );
}
