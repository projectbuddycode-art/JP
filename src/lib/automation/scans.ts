import { createAdminClient } from "@/lib/supabase/admin";
import { istDateKey } from "@/lib/reports/timezone";
import { buildLeadRegister, managementSnapshot, type BookingRow, type LeadRow } from "@/lib/reports/intelligence";

async function notifyOwners(title: string, body: string, href: string) {
  const admin = createAdminClient();
  const { data: people } = await admin
    .from("profiles")
    .select("id, role, workspace_role")
    .eq("status", "active");
  const targets = (people ?? []).filter(
    (person) => person.role === "owner" || ["owner", "admin", "finance", "operations_manager"].includes(String(person.workspace_role)),
  );
  for (const person of targets) {
    await admin.from("notifications").insert({ profile_id: person.id, title, body, href });
  }
  return targets.length;
}

export async function remindOutstandingPayments() {
  const admin = createAdminClient();
  const { data: bookings } = await admin
    .from("bookings")
    .select("id, confirmed_amount, amount_received, amount_paid, booking_status, contact_id")
    .in("booking_status", ["confirmed", "completed"]);
  const due = (bookings ?? []).filter((booking) => {
    const outstanding = Number(booking.confirmed_amount ?? 0) - Number(booking.amount_received ?? booking.amount_paid ?? 0);
    return outstanding > 0;
  });
  if (due.length) {
    await notifyOwners(
      "Customer balances outstanding",
      `${due.length} confirmed booking(s) still have a balance. This is not treated as cash received.`,
      "/bookings",
    );
  }
  return { outstandingBookings: due.length };
}

export async function alertUpcomingDepartures() {
  const admin = createAdminClient();
  const start = new Date();
  const end = new Date(Date.now() + 7 * 86_400_000);
  const { data: trips } = await admin
    .from("departures")
    .select("id, name, start_date, status")
    .gte("start_date", start.toISOString().slice(0, 10))
    .lte("start_date", end.toISOString().slice(0, 10))
    .neq("status", "cancelled");
  if ((trips ?? []).length) {
    await notifyOwners(
      "Upcoming departures",
      `${trips?.length} departure(s) start within 7 days.`,
      "/departures",
    );
  }
  return { upcoming: trips?.length ?? 0 };
}

export async function remindMissingDocuments() {
  const admin = createAdminClient();
  const { data: travellers } = await admin
    .from("departure_travellers")
    .select("id, full_name, document_status, departure_id")
    .eq("document_status", "pending")
    .limit(80);
  if ((travellers ?? []).length) {
    await notifyOwners(
      "Traveller documents pending",
      `${travellers?.length} traveller record(s) still have pending documents.`,
      "/travellers",
    );
  }
  return { pendingDocuments: travellers?.length ?? 0 };
}

export async function remindUnconfirmedSuppliers() {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("departure_suppliers")
    .select("id, service, status, departure_id")
    .neq("status", "confirmed")
    .limit(80);
  if ((rows ?? []).length) {
    await notifyOwners(
      "Supplier confirmations pending",
      `${rows?.length} supplier assignment(s) are not confirmed.`,
      "/operations",
    );
  }
  return { unconfirmed: rows?.length ?? 0 };
}

export async function generatePeriodReport(period: "daily" | "weekly" | "monthly") {
  const admin = createAdminClient();
  const to = istDateKey();
  const days = period === "daily" ? 0 : period === "weekly" ? 6 : 29;
  const from = istDateKey(new Date(Date.now() - days * 86_400_000));

  const [{ data: leads }, { data: bookings }, { data: tasks }] = await Promise.all([
    admin.from("leads").select("id, full_name, created_at, received_at, is_test, contact_id, source, destination, owner_id"),
    admin.from("bookings").select("id, booking_status, confirmed_amount, amount_paid, amount_received, created_at"),
    admin.from("tasks").select("type, status, due_at"),
  ]);

  const register = buildLeadRegister((leads ?? []) as LeadRow[], from, to);
  const snapshot = managementSnapshot(register, (bookings ?? []) as BookingRow[], tasks ?? []);
  const { data: run } = await admin
    .from("report_runs")
    .insert({
      status: "generated",
      finished_at: new Date().toISOString(),
      summary: { period, from, to, timezone: "Asia/Kolkata", snapshot, delivered: false },
    })
    .select("id")
    .maybeSingle();

  await notifyOwners(
    `${period} report generated`,
    `Leads ${snapshot.newLeads} · bookings ${snapshot.confirmed} · cash collected ${snapshot.cashReceived}. Email delivery stays pending until Resend is configured.`,
    "/reports",
  );

  return {
    runId: run?.id ?? null,
    period,
    from,
    to,
    snapshot,
    delivered: false,
    reason: "In-app snapshot stored. Email/WhatsApp delivery stays pending until a provider confirms send.",
  };
}
