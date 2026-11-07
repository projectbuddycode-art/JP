import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { dashboardMetrics } from "@/lib/crm/queries";
import { KPI_DEFINITIONS } from "@/lib/kpi";
import { suggestNextAction } from "@/lib/crm/next-action";
import { compactCount, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { READINESS_LABEL, readinessStatus } from "@/lib/ops/readiness";
import { tripProfitability } from "@/lib/ops/finance";
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
  const metrics = await dashboardMetrics(supabase, from, to, now);
  const [
    { data: posts },
    { data: departures },
    { data: checklist },
    { data: travellers },
    { data: supplierRows },
    { data: days },
    { data: expenses },
    { data: failedEvents },
    { data: failedJobs },
  ] = await Promise.all([
    supabase.from("social_posts").select("id, title, scheduled_for, status").eq("status", "scheduled").order("scheduled_for", { ascending: true }).limit(5),
    supabase.from("departures").select("*").neq("status", "cancelled").order("start_date").limit(12),
    supabase.from("departure_checklist").select("departure_id, item_key, critical, completed"),
    supabase.from("departure_travellers").select("id, departure_id, emergency_contact, document_status"),
    supabase.from("departure_suppliers").select("departure_id, agreed_cost, advance_paid, status"),
    supabase.from("itinerary_days").select("id, departure_id"),
    supabase.from("trip_expenses").select("amount"),
    supabase.from("integration_events").select("id, status, outcome").in("status", ["failed", "error"]).limit(20),
    supabase.from("automation_executions").select("id").eq("status", "failed").limit(20),
  ]);
  const { data: demo } = await supabase.from("workspace_settings").select("demo_mode").maybeSingle();
  const profit = tripProfitability({
    bookings: metrics.bookings,
    payments: [],
    supplierCosts: supplierRows ?? [],
    expenses: expenses ?? [],
  });

  const week = new Date(now.getTime() + 7 * 86_400_000).toISOString().slice(0, 10);
  const alerts: string[] = [];
  let notReady = 0;
  let inProgress = 0;
  for (const item of departures ?? []) {
    const items = (checklist ?? []).filter((row) => row.departure_id === item.id);
    const ready = readinessStatus(items);
    if (item.status === "in_progress") inProgress += 1;
    if (ready !== "ready") notReady += 1;
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

  const sales = [
    ["New today", metrics.newLeadsToday, KPI_DEFINITIONS.newLeads],
    ["New this week", metrics.newLeadsWeek, "Enquiries received in the last seven days."],
    ["Qualified", metrics.qualifiedLeads, KPI_DEFINITIONS.qualifiedLeads],
    ["Follow-ups due", metrics.followUpsDueToday, KPI_DEFINITIONS.followUpsDueToday],
    ["Overdue follow-ups", metrics.overdueFollowUps, KPI_DEFINITIONS.overdueFollowUps],
    ["Proposals open", metrics.activeProposals, KPI_DEFINITIONS.activeProposals],
    ["Confirmed bookings", metrics.confirmedBookings, KPI_DEFINITIONS.confirmedBookings],
    ["Conversion", `${Math.round(metrics.leadToBookingConversion * 100)}%`, KPI_DEFINITIONS.leadToBookingConversion],
  ] as const;

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Sales, operations and cash from recorded data. Promised booking value is shown separately from money collected."
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

      <h2 className="mb-3 font-serif text-2xl">Sales</h2>
      <div className="grid gap-4 md:grid-cols-4">
        {sales.map(([label, value, definition]) => (
          <Card key={label}>
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 font-serif text-3xl">{typeof value === "number" ? compactCount(value) : value}</p>
            <p className="mt-2 text-xs text-muted">{definition}</p>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 mt-8 font-serif text-2xl">Trip operations</h2>
      <div className="grid gap-4 md:grid-cols-4">
        <Card><p className="text-sm text-muted">Upcoming departures</p><p className="mt-2 font-serif text-3xl">{(departures ?? []).length}</p></Card>
        <Card><p className="text-sm text-muted">In progress</p><p className="mt-2 font-serif text-3xl">{inProgress}</p></Card>
        <Card><p className="text-sm text-muted">Not ready</p><p className="mt-2 font-serif text-3xl">{notReady}</p></Card>
        <Card><p className="text-sm text-muted">Travellers on file</p><p className="mt-2 font-serif text-3xl">{(travellers ?? []).length}</p></Card>
      </div>

      <h2 className="mb-3 mt-8 font-serif text-2xl">Finance</h2>
      <div className="grid gap-4 md:grid-cols-4">
        <Card><p className="text-sm text-muted">Booking value</p><p className="mt-2 font-serif text-3xl">{formatCurrency(metrics.bookingValue)}</p><p className="mt-2 text-xs text-muted">Confirmed amounts, not cash.</p></Card>
        <Card><p className="text-sm text-muted">Collected</p><p className="mt-2 font-serif text-3xl">{formatCurrency(metrics.recordedRevenue)}</p><p className="mt-2 text-xs text-muted">{KPI_DEFINITIONS.recordedRevenue}</p></Card>
        <Card><p className="text-sm text-muted">Customer outstanding</p><p className="mt-2 font-serif text-3xl">{formatCurrency(metrics.outstandingBalance)}</p></Card>
        <Card><p className="text-sm text-muted">Recorded trip profit</p><p className="mt-2 font-serif text-3xl">{formatCurrency(profit.actualProfit)}</p><p className="mt-2 text-xs text-muted">Collected minus recorded supplier advances and expenses.</p></Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-xl">Action centre</h2>
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
          <h2 className="font-serif text-xl">Operational alerts</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {alerts.slice(0, 12).map((alert) => (
              <li key={alert} className="rounded-md border border-warm/40 bg-amber-50 px-3 py-2">{alert}</li>
            ))}
            {!alerts.length ? <li className="text-muted">No operational alerts from recorded data.</li> : null}
          </ul>
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
          <h2 className="font-serif text-xl">Business</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {metrics.sources.map(([name, count]) => (
              <li key={name} className="flex justify-between"><span>{name}</span><span>{count}</span></li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">Failed ingest events: {(failedEvents ?? []).length}. Failed automations: {(failedJobs ?? []).length}.</p>
          <div className="mt-4 space-y-2">
            {(posts ?? []).map((post) => (
              <div key={post.id} className="flex items-center justify-between rounded-md border border-line p-3 text-sm">
                <span>{post.title || "Untitled"} · {formatDateTime(post.scheduled_for)}</span>
                <Badge>{post.status}</Badge>
              </div>
            ))}
            {!(posts ?? []).length ? <p className="text-sm text-muted">No scheduled social posts.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
