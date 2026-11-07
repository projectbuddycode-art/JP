"use server";

import { revalidatePath } from "next/cache";
import { requireActiveProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/audit";
import { CHECKLIST_TEMPLATE } from "@/lib/ops/readiness";

export async function createDepartureAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  if (!can(profile, "bookings.manage") && !can(profile, "packages.manage")) {
    throw new Error("You cannot create departures.");
  }
  const name = String(formData.get("name") || "").trim();
  const startDate = String(formData.get("start_date") || "");
  if (!name || !startDate) throw new Error("Name and start date are required.");
  const { data, error } = await supabase
    .from("departures")
    .insert({
      name,
      package_id: String(formData.get("package_id") || "") || null,
      destination: String(formData.get("destination") || ""),
      start_date: startDate,
      end_date: String(formData.get("end_date") || "") || null,
      start_location: String(formData.get("start_location") || ""),
      capacity: Number(formData.get("capacity") || 12),
      status: "planning",
      trip_leader_id: String(formData.get("trip_leader_id") || "") || null,
      internal_notes: String(formData.get("internal_notes") || ""),
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create departure");
  await supabase.from("departure_checklist").insert(
    CHECKLIST_TEMPLATE.map((item) => ({
      departure_id: data.id,
      item_key: item.key,
      label: item.label,
      group_name: item.group,
      critical: item.critical,
    })),
  );
  await writeAudit({ actor: profile, action: "departure_created", entityType: "departures", entityId: data.id, entityName: name });
  revalidatePath("/departures");
  revalidatePath("/overview");
}

export async function addTravellerAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  const departureId = String(formData.get("departure_id"));
  const fullName = String(formData.get("full_name") || "").trim();
  if (!fullName) throw new Error("Traveller name is required");
  const { error } = await supabase.from("departure_travellers").insert({
    departure_id: departureId,
    booking_id: String(formData.get("booking_id") || "") || null,
    full_name: fullName,
    phone_e164: String(formData.get("phone") || "") || null,
    email: String(formData.get("email") || "") || null,
    emergency_contact: String(formData.get("emergency_contact") || "") || null,
    room_preference: String(formData.get("room_preference") || "") || null,
    special_requirements: String(formData.get("special_requirements") || "") || null,
  });
  if (error) throw new Error(error.message);
  await writeAudit({ actor: profile, action: "traveller_added", entityType: "departures", entityId: departureId, entityName: fullName });
  revalidatePath(`/departures/${departureId}`);
  revalidatePath("/travellers");
}

export async function markAttendanceAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  const id = String(formData.get("id"));
  const attendance = String(formData.get("attendance") || "present");
  const { data: row } = await supabase.from("departure_travellers").select("departure_id, full_name").eq("id", id).single();
  await supabase.from("departure_travellers").update({ attendance }).eq("id", id);
  await writeAudit({
    actor: profile,
    action: "attendance_recorded",
    entityType: "departure_travellers",
    entityId: id,
    entityName: row?.full_name,
    newValue: attendance,
  });
  if (row?.departure_id) revalidatePath(`/departures/${row.departure_id}/live`);
}

export async function recordPaymentAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  if (!can(profile, "revenue.view") && !can(profile, "bookings.manage")) {
    throw new Error("You cannot record payments.");
  }
  const bookingId = String(formData.get("booking_id"));
  const amount = Number(formData.get("amount"));
  if (!bookingId || !amount) throw new Error("Booking and amount are required");
  const { error } = await supabase.from("booking_payments").insert({
    booking_id: bookingId,
    amount,
    paid_on: String(formData.get("paid_on") || new Date().toISOString().slice(0, 10)),
    method: String(formData.get("method") || "bank"),
    reference: String(formData.get("reference") || ""),
    recorded_by: profile.id,
  });
  if (error) throw new Error(error.message);
  const { data: payments } = await supabase.from("booking_payments").select("amount").eq("booking_id", bookingId);
  const received = (payments ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const { data: booking } = await supabase.from("bookings").select("confirmed_amount").eq("id", bookingId).single();
  const confirmed = Number(booking?.confirmed_amount ?? 0);
  const paymentStatus = received <= 0 ? "unpaid" : confirmed > 0 && received >= confirmed ? "paid" : "deposit";
  await supabase
    .from("bookings")
    .update({
      amount_paid: received,
      amount_received: received,
      payment_status: paymentStatus,
    })
    .eq("id", bookingId);
  await writeAudit({ actor: profile, action: "payment_recorded", entityType: "bookings", entityId: bookingId, newValue: String(amount) });
  revalidatePath("/bookings");
}

export async function saveSupplierAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Supplier name is required");
  const { error } = await supabase.from("suppliers").insert({
    name,
    kind: String(formData.get("kind") || "hotel"),
    contact_name: String(formData.get("contact_name") || ""),
    phone_e164: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    location: String(formData.get("location") || ""),
    notes: String(formData.get("notes") || ""),
    active: true,
  });
  if (error) throw new Error(error.message);
  await writeAudit({ actor: profile, action: "supplier_created", entityType: "suppliers", entityName: name });
  revalidatePath("/operations");
}

export async function assignSupplierAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  const departureId = String(formData.get("departure_id"));
  const { error } = await supabase.from("departure_suppliers").insert({
    departure_id: departureId,
    supplier_id: String(formData.get("supplier_id") || "") || null,
    service: String(formData.get("service") || ""),
    agreed_cost: Number(formData.get("agreed_cost") || 0),
    advance_paid: Number(formData.get("advance_paid") || 0),
    status: String(formData.get("status") || "requested"),
  });
  if (error) throw new Error(error.message);
  await writeAudit({ actor: profile, action: "supplier_assigned", entityType: "departures", entityId: departureId });
  revalidatePath(`/departures/${departureId}`);
  revalidatePath("/operations");
}

export async function toggleChecklistAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  const id = String(formData.get("id"));
  const completed = String(formData.get("completed")) === "true";
  const { data: previous } = await supabase.from("departure_checklist").select("departure_id, completed, label").eq("id", id).single();
  await supabase
    .from("departure_checklist")
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq("id", id);
  await writeAudit({
    actor: profile,
    action: "checklist_updated",
    entityType: "departures",
    entityId: previous?.departure_id,
    field: previous?.label,
    previousValue: String(previous?.completed),
    newValue: String(completed),
  });
  if (previous?.departure_id) revalidatePath(`/departures/${previous.departure_id}`);
}

export async function addItineraryDayAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  const departureId = String(formData.get("departure_id") || "") || null;
  const packageId = String(formData.get("package_id") || "") || null;
  const { error } = await supabase.from("itinerary_days").insert({
    departure_id: departureId,
    package_id: packageId,
    day_number: Number(formData.get("day_number") || 1),
    location: String(formData.get("location") || ""),
    activities: String(formData.get("activities") || ""),
    accommodation: String(formData.get("accommodation") || ""),
    customer_notes: String(formData.get("customer_notes") || ""),
    internal_notes: String(formData.get("internal_notes") || ""),
  });
  if (error) throw new Error(error.message);
  await writeAudit({ actor: profile, action: "itinerary_updated", entityType: "departures", entityId: departureId ?? packageId ?? undefined });
  if (departureId) revalidatePath(`/departures/${departureId}`);
}

export async function addIncidentAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  const departureId = String(formData.get("departure_id"));
  const body = String(formData.get("body") || "").trim();
  if (!body) throw new Error("Incident note is required");
  await supabase.from("trip_incidents").insert({ departure_id: departureId, body, created_by: profile.id });
  await writeAudit({ actor: profile, action: "incident_recorded", entityType: "departures", entityId: departureId });
  revalidatePath(`/departures/${departureId}`);
}

export async function recordExpenseAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  const departureId = String(formData.get("departure_id"));
  const amount = Number(formData.get("amount"));
  if (!amount) throw new Error("Amount is required");
  await supabase.from("trip_expenses").insert({
    departure_id: departureId,
    category: String(formData.get("category") || "misc"),
    amount,
    incurred_on: String(formData.get("incurred_on") || new Date().toISOString().slice(0, 10)),
    notes: String(formData.get("notes") || ""),
    recorded_by: profile.id,
  });
  await writeAudit({ actor: profile, action: "expense_recorded", entityType: "departures", entityId: departureId, newValue: String(amount) });
  revalidatePath(`/departures/${departureId}`);
}

export async function linkBookingDepartureAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  const bookingId = String(formData.get("booking_id"));
  const departureId = String(formData.get("departure_id") || "") || null;
  const previous = (await supabase.from("bookings").select("departure_id").eq("id", bookingId).single()).data;
  await supabase.from("bookings").update({ departure_id: departureId }).eq("id", bookingId);
  await writeAudit({
    actor: profile,
    action: "booking_departure_linked",
    entityType: "bookings",
    entityId: bookingId,
    previousValue: previous?.departure_id,
    newValue: departureId,
  });
  revalidatePath("/bookings");
}
