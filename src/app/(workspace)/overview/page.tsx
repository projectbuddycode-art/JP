import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { dashboardMetrics } from "@/lib/crm/queries";
import { KPI_DEFINITIONS } from "@/lib/kpi";
import { suggestNextAction } from "@/lib/crm/next-action";
import { compactCount, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { READINESS_LABEL, readinessStatus } from "@/lib/ops/readiness";
import { requestNow } from "@/lib/now";

export const instant = false;

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { supabase } = await requireActiveProfile();
  const params = await searchParams;
  const now = await requestNow();
  const from = params.from ?? new Date(now.getTime() - 30 * 86_400_000).toISOString().slice(0, 10);
  const to = params.to ?? now.toISOString().slice(0, 10);
  const metrics = await dashboardMetrics(supabase, from, to);
  const [{ data: posts }, { data: departures }, { data: checklist }, { data: travellers }, { data: supplierRows }, { data: days }] = await Promise.all([
    supabase.from("social_posts").select("id, title, scheduled_for, status").eq("status", "scheduled").order("scheduled_for", { ascending: true }).limit(5),
    supabase.from("departures").select("*").neq("status", "cancelled").order("start_date").limit(12),
    supabase.from("departure_checklist").select("departure_id, item_key, critical, completed"),
    supabase.from("departure_travellers").select("id, departure_id, emergency_contact, document_status"),
    supabase.from("departure_suppliers").select("departure_id, agreed_cost, advance_paid, status"),
    supabase.from("itinerary_days").select("id, departure_id"),
  ]);
  const { data: demo } = await supabase.from("workspace_settings").select("demo_mode").maybeSingle();

  const week = new Date(now.getTime() + 7 * 86_400_000).toISOString().slice(0, 10);
  const alerts: string[] = [];
  for (const item of departures ?? []) {
    const items = (checklist ?? []).filter((row) => row.departure_id === item.id);
    const ready = readinessStatus(items);
    if (!item.trip_leader_id) alerts.push(`${item.name}: missing trip leader`);
    if (!(days ?? []).some((day) => day.departure_id === item.id)) alerts.push(`${item.name}: incomplete itinerary`);
    if (items.find((row) => row.item_key === "hotel_confirmed" && !row.completed)) alerts.push(`${item.name}: hotel not confirmed`);
    if (items.find((row) => row.item_key === "vehicles_assigned" && !row.completed)) alerts.push(`${item.name}: vehicle not assigned`);
    if (item.start_date && item.start_date <= week && ready !== "ready") alerts.push(`${item.name}: departing within 7 days and not ready`);
  }
  if ((travellers ?? []).some((person) => !person.emergency_contact)) alerts.push("Travellers missing emergency contacts");
  if ((supplierRows ?? []).some((row) => Number(row.agreed_cost ?? 0) > Number(row.advance_paid ?? 0) && row.status !== "cancelled")) {
    alerts.push("Supplier balances still outstanding");
  }
  const kpis = [
    ["New enquiries", metrics.newLeads, KPI_DEFINITIONS.newLeads],
    ["Follow-ups due today", metrics.followUpsDueToday, KPI_DEFINITIONS.followUpsDueToday],
    ["Overdue follow-ups", metrics.overdueFollowUps, KPI_DEFINITIONS.overdueFollowUps],
    ["Confirmed bookings", metrics.confirmedBookings, KPI_DEFINITIONS.confirmedBookings],
    ["Payments overdue", metrics.paymentsOverdue, "Confirmed bookings where collected cash is still below confirmed amount."],
    ["Active proposals", metrics.activeProposals, KPI_DEFINITIONS.activeProposals],
  ] as const;

  return (
    <div>
      <PageHeader
        title="Overview"
        description="What needs action today: enquiries, follow-ups, payments, and departures that are not ready."
        actions={
          <form className="flex gap-2 text-sm">
            <input type="date" name="from" defaultValue={from} className="rounded-md border border-line px-2 py-1" />
            <input type="date" name="to" defaultValue={to} className="rounded-md border border-line px-2 py-1" />
            <button className="rounded-md bg-accent px-3 py-1 text-white">Apply</button>
          </form>
        }
      />
      {demo?.demo_mode ? (
        <div className="mb-4 rounded-md border border-warm/40 bg-amber-50 px-4 py-2 text-sm">
          Demo data is enabled for this workspace and is isolated by the seed flag. Turn it off in Settings after connecting production data.
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        {kpis.map(([label, value, definition]) => (
          <Card key={label} title={definition}>
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 font-serif text-3xl">{compactCount(value)}</p>
            <p className="mt-2 text-xs text-muted">{definition}</p>
          </Card>
        ))}
        <Card>
          <p className="text-sm text-muted">Recorded revenue</p>
          <p className="mt-2 font-serif text-3xl">{formatCurrency(metrics.recordedRevenue)}</p>
          <p className="mt-2 text-xs text-muted">{KPI_DEFINITIONS.recordedRevenue}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Weighted pipeline</p>
          <p className="mt-2 font-serif text-3xl">{formatCurrency(metrics.weightedPipelineValue)}</p>
          <p className="mt-2 text-xs text-muted">{KPI_DEFINITIONS.weightedPipelineValue}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Lead-to-booking conversion</p>
          <p className="mt-2 font-serif text-3xl">{Math.round(metrics.leadToBookingConversion * 100)}%</p>
          <p className="mt-2 text-xs text-muted">{KPI_DEFINITIONS.leadToBookingConversion}</p>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-xl">Leads to act on today</h2>
          <div className="mt-4 space-y-3">
            {metrics.leads.slice(0, 8).map((lead) => {
              const suggestion = suggestNextAction({
                stageSlug: lead.lead_stages?.slug ?? "new_enquiry",
                hasPhone: Boolean(lead.phone_e164),
                hasEmail: Boolean(lead.email),
                lastInteractionAt: lead.last_interaction_at,
                nextFollowUpAt: lead.next_follow_up_at,
                hasQuote: false,
                missingFields: [
                  !lead.destination ? "destination" : "",
                  !lead.preferred_start ? "travel_dates" : "",
                  !lead.travellers ? "travellers" : "",
                ].filter(Boolean),
                consentMarketing: false,
                staleDays: lead.last_interaction_at
                  ? Math.floor((now.getTime() - new Date(lead.last_interaction_at).getTime()) / 86_400_000)
                  : 99,
                isLost: Boolean(lead.lead_stages?.is_lost),
                isWon: Boolean(lead.lead_stages?.is_won),
              });
              return (
                <Link key={lead.id} href={`/leads/${lead.id}`} className="block rounded-md border border-line p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{lead.full_name ?? "Unnamed enquiry"}</p>
                      <p className="text-sm text-muted">{suggestion.action}</p>
                    </div>
                    <Badge tone={suggestion.intent === "high" ? "danger" : "default"}>
                      {lead.lead_stages?.name}
                    </Badge>
                  </div>
                </Link>
              );
            })}
            {metrics.leads.length === 0 ? (
              <p className="text-sm text-muted">No leads yet. Create one or connect a lead source.</p>
            ) : null}
          </div>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Upcoming departures</h2>
          <div className="mt-4 space-y-3">
            {(departures ?? []).map((item) => {
              const ready = readinessStatus((checklist ?? []).filter((row) => row.departure_id === item.id));
              return (
                <Link key={item.id} href={`/departures/${item.id}`} className="block rounded-md border border-line p-3">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted">{formatDate(item.start_date)} · {READINESS_LABEL[ready]}</p>
                </Link>
              );
            })}
            {!(departures ?? []).length ? <p className="text-sm text-muted">No dated departures. Create one under Trips & Departures.</p> : null}
          </div>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Alerts</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {alerts.slice(0, 12).map((alert) => (
              <li key={alert} className="rounded-md border border-warm/40 bg-amber-50 px-3 py-2">{alert}</li>
            ))}
            {!alerts.length ? <li className="text-muted">No operational alerts from recorded data.</li> : null}
          </ul>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Upcoming scheduled posts</h2>
          <div className="mt-4 space-y-3">
            {(posts ?? []).map((post) => (
              <div key={post.id} className="flex items-center justify-between rounded-md border border-line p-3">
                <div>
                  <p className="font-medium">{post.title || "Untitled"}</p>
                  <p className="text-sm text-muted">{formatDateTime(post.scheduled_for)}</p>
                </div>
                <Badge>{post.status}</Badge>
              </div>
            ))}
            {(posts ?? []).length === 0 ? (
              <p className="text-sm text-muted">Nothing scheduled. Open Social Media Studio to plan content.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
