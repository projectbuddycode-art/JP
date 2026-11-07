import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { dashboardMetrics } from "@/lib/crm/queries";
import { KPI_DEFINITIONS } from "@/lib/kpi";
import { formatCurrency } from "@/lib/utils";
import { requestNow } from "@/lib/now";
import { istDateKey } from "@/lib/reports/timezone";

export const instant = false;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { supabase } = await requireActiveProfile();
  const now = await requestNow();
  const { period } = await searchParams;
  const span = period === "day" ? 0 : period === "week" ? 6 : period === "month" ? 29 : 89;
  const to = istDateKey(now);
  const from = istDateKey(new Date(now.getTime() - span * 86_400_000));
  const metrics = await dashboardMetrics(supabase, from, to, now);
  const byStage = new Map<string, number>();
  const bySource = new Map<string, number>();
  const byDestination = new Map<string, number>();
  const lost = new Map<string, number>();
  for (const lead of metrics.leads) {
    byStage.set(lead.lead_stages?.name ?? "Unknown", (byStage.get(lead.lead_stages?.name ?? "Unknown") ?? 0) + 1);
    bySource.set(lead.source ?? "unknown", (bySource.get(lead.source ?? "unknown") ?? 0) + 1);
    byDestination.set(lead.destination ?? "unspecified", (byDestination.get(lead.destination ?? "unspecified") ?? 0) + 1);
    if (lead.lost_reason) lost.set(lead.lost_reason, (lost.get(lead.lost_reason) ?? 0) + 1);
  }
  return (
    <div>
      <PageHeader title="Reports & analytics" description={`IST window ${from} → ${to}. ${KPI_DEFINITIONS.leadToBookingConversion} Cash collected is ${formatCurrency(metrics.recordedRevenue)}; booking value (not cash) is ${formatCurrency(metrics.bookingValue)}; outstanding is ${formatCurrency(metrics.outstandingBalance)}.`} />
      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <Link className="rounded-md border border-line px-3 py-2" href="/reports?period=day">Daily</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/reports?period=week">Weekly</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/reports?period=month">Monthly</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/reports/register">Lead register</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/partners">Partner performance</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/departures">Departures</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/bookings">Bookings & payments</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/audit">Audit log</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-serif text-xl">Leads by stage</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {[...byStage.entries()].map(([name, count]) => (
              <li key={name} className="flex justify-between"><span>{name}</span><span>{count}</span></li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Lead sources</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {[...bySource.entries()].map(([name, count]) => (
              <li key={name} className="flex justify-between"><span>{name}</span><span>{count}</span></li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Destinations</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {[...byDestination.entries()].map(([name, count]) => (
              <li key={name} className="flex justify-between"><span>{name}</span><span>{count}</span></li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Lost reasons</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {[...lost.entries()].length ? [...lost.entries()].map(([name, count]) => (
              <li key={name} className="flex justify-between"><span>{name}</span><span>{count}</span></li>
            )) : <li className="text-muted">No lost reasons recorded</li>}
          </ul>
          <p className="mt-4 text-sm">Pipeline value {formatCurrency(metrics.weightedPipelineValue)}</p>
        </Card>
      </div>
    </div>
  );
}
