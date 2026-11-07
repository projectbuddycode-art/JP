import { hourBucket, inIstRange, istHour } from "@/lib/reports/timezone";

export const REPORT_DEFINITIONS = {
  leadsReceived:
    "Count of lead records whose received_at (fallback created_at) falls in the reporting window. Test events excluded unless the report is explicitly in test mode.",
  uniqueContacts: "Distinct contact_id values among leads received in the window.",
  tripEnquiries: "Trip enquiry rows in the window, independent of lead count.",
  confirmedBookings: "Bookings with booking_status confirmed or completed. Cancelled bookings are excluded.",
  cancelledBookings: "Bookings with booking_status cancelled.",
  recordedRevenue: "Sum of confirmed_amount on confirmed/completed bookings. This is not cash collected.",
  cashReceived: "Sum of amount_received / amount_paid on bookings. Distinct from recorded revenue.",
  conversion:
    "Confirmed+completed bookings in the window divided by leads received in the window.",
} as const;

export type LeadRow = {
  id: string;
  full_name: string | null;
  phone_e164?: string | null;
  source?: string | null;
  destination?: string | null;
  campaign_id?: string | null;
  owner_id?: string | null;
  travellers?: number | null;
  budget_max?: number | null;
  preferred_start?: string | null;
  created_at: string;
  received_at?: string | null;
  first_response_at?: string | null;
  last_interaction_at?: string | null;
  archived_at?: string | null;
  is_test?: boolean;
  lead_stages?: { slug?: string; name?: string; is_won?: boolean; is_lost?: boolean } | null;
  stage?: { slug?: string; name?: string; is_won?: boolean; is_lost?: boolean } | null;
};

export type BookingRow = {
  id: string;
  booking_status: string;
  confirmed_amount?: number | null;
  amount_paid?: number | null;
  amount_received?: number | null;
  created_at: string;
  owner_id?: string | null;
  partner_id?: string | null;
  lead_id?: string | null;
};

export function receivedAt(lead: LeadRow) {
  return lead.received_at || lead.created_at;
}

export function inRange(iso: string, from: string, to: string) {
  return inIstRange(iso, from, to);
}

export function buildLeadRegister(leads: LeadRow[], from: string, to: string) {
  return leads.filter((lead) => !lead.is_test && inRange(receivedAt(lead), from, to));
}

export function hourlyAnalysis(leads: LeadRow[]) {
  const buckets: Record<string, number> = {
    "00:00–05:59": 0,
    "06:00–08:59": 0,
    "09:00–11:59": 0,
    "12:00–14:59": 0,
    "15:00–17:59": 0,
    "18:00–20:59": 0,
    "21:00–23:59": 0,
  };
  for (const lead of leads) {
    const bucket = hourBucket(istHour(receivedAt(lead)));
    buckets[bucket] += 1;
  }
  return buckets;
}

export function countBy(list: LeadRow[], key: (lead: LeadRow) => string) {
  const map = new Map<string, number>();
  for (const item of list) {
    const value = key(item) || "unspecified";
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export function managementSnapshot(
  leads: LeadRow[],
  bookings: BookingRow[],
  tasks: Array<{ type?: string; status?: string; due_at?: string | null }>,
) {
  const confirmed = bookings.filter((item) => ["confirmed", "completed"].includes(item.booking_status));
  const cancelled = bookings.filter((item) => item.booking_status === "cancelled");
  const revenue = confirmed.reduce((sum, item) => sum + Number(item.confirmed_amount ?? 0), 0);
  const cash = confirmed.reduce(
    (sum, item) => sum + Number(item.amount_received ?? item.amount_paid ?? 0),
    0,
  );
  const qualified = leads.filter((lead) => {
    const stage = lead.lead_stages || lead.stage;
    return Boolean(stage && !stage.is_lost && (stage.slug === "qualified" || Number((stage as { probability?: number }).probability) >= 0.25 || ["qualified", "trip_requirements_confirmed", "itinerary_shared", "negotiation", "booking_pending", "confirmed_booking"].includes(stage.slug ?? "")));
  });
  const overdue = tasks.filter(
    (task) => task.type === "follow_up" && task.status === "open" && task.due_at && task.due_at < new Date().toISOString(),
  );
  return {
    newLeads: leads.length,
    uniqueContacts: new Set(leads.map((lead) => lead.id)).size,
    qualified: qualified.length,
    confirmed: confirmed.length,
    cancelled: cancelled.length,
    recordedRevenue: revenue,
    cashReceived: cash,
    conversion: leads.length ? confirmed.length / leads.length : 0,
    overdueFollowUps: overdue.length,
  };
}

export function weekDelta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 1;
  return (current - previous) / previous;
}
