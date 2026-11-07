import { Card, PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { buildLeadRegister, countBy, hourlyAnalysis, managementSnapshot } from "@/lib/reports/intelligence";
import { formatIst } from "@/lib/reports/timezone";
import { formatCurrency } from "@/lib/utils";

export const instant = false;

export default async function LeadRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { supabase, profile } = await requireActiveProfile();
  const params = await searchParams;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const from = params.from || today;
  const to = params.to || today;
  const { data: leads } = await supabase
    .from("leads")
    .select("*, lead_stages(*)")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(500);
  const { data: bookings } = await supabase.from("bookings").select("*").limit(500);
  const { data: tasks } = await supabase.from("tasks").select("type, status, due_at").limit(500);
  const rows = buildLeadRegister(leads ?? [], from, to);
  const hours = hourlyAnalysis(rows);
  const snapshot = managementSnapshot(rows, bookings ?? [], tasks ?? []);
  const showPhone = can(profile, "reports.financial") || can(profile, "leads.view_all");

  return (
    <div>
      <PageHeader
        title="Daily lead arrival register"
        description="Counts use received_at (fallback created_at). Enquiries are not revenue."
      />
      <form className="mb-4 flex flex-wrap gap-3">
        <input type="date" name="from" defaultValue={from} className="rounded-md border border-line px-3 py-2 text-sm" />
        <input type="date" name="to" defaultValue={to} className="rounded-md border border-line px-3 py-2 text-sm" />
        <button className="rounded-md bg-accent px-3 py-2 text-sm text-white">Apply</button>
        <a className="rounded-md border border-line px-3 py-2 text-sm" href={`/api/reports/export?from=${from}&to=${to}`}>
          Export CSV
        </a>
      </form>
      <div className="grid gap-4 md:grid-cols-4">
        <Card><p className="text-sm text-muted">Enquiries in range</p><p className="font-serif text-3xl">{snapshot.newLeads}</p></Card>
        <Card><p className="text-sm text-muted">Qualified</p><p className="font-serif text-3xl">{snapshot.qualified}</p></Card>
        <Card><p className="text-sm text-muted">Confirmed bookings</p><p className="font-serif text-3xl">{snapshot.confirmed}</p></Card>
        <Card><p className="text-sm text-muted">Recorded booking value</p><p className="font-serif text-3xl">{formatCurrency(snapshot.recordedRevenue)}</p></Card>
      </div>
      <Card className="mt-6">
        <h2 className="font-serif text-xl">Hourly arrival (IST)</h2>
        <ul className="mt-3 grid gap-2 md:grid-cols-4 text-sm">
          {Object.entries(hours).map(([bucket, count]) => (
            <li key={bucket} className="rounded-md border border-line px-3 py-2">{bucket}: {count}</li>
          ))}
        </ul>
      </Card>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="font-medium">By source</h3>
          <ul className="mt-2 text-sm">{countBy(rows, (lead) => lead.source ?? "unknown").map(([k, v]) => <li key={k}>{k}: {v}</li>)}</ul>
        </Card>
        <Card>
          <h3 className="font-medium">By destination</h3>
          <ul className="mt-2 text-sm">{countBy(rows, (lead) => lead.destination ?? "unspecified").map(([k, v]) => <li key={k}>{k}: {v}</li>)}</ul>
        </Card>
        <Card>
          <h3 className="font-medium">By partner</h3>
          <ul className="mt-2 text-sm">{countBy(rows, (lead) => lead.owner_id ?? "unassigned").map(([k, v]) => <li key={k}>{k.slice(0, 8)}: {v}</li>)}</ul>
        </Card>
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-accent-soft text-muted">
            <tr>
              {["Lead", "Received", "Source", "Destination", "Travellers", "Budget", "Stage", "First response"].map((h) => (
                <th key={h} className="px-3 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((lead) => (
              <tr key={lead.id} className="border-t border-line">
                <td className="px-3 py-2">
                  {lead.full_name}
                  <div className="text-xs text-muted">{lead.id.slice(0, 8)}{showPhone && lead.phone_e164 ? ` · ${lead.phone_e164}` : ""}</div>
                </td>
                <td className="px-3 py-2">{formatIst(lead.received_at || lead.created_at)}</td>
                <td className="px-3 py-2">{lead.source}</td>
                <td className="px-3 py-2">{lead.destination}</td>
                <td className="px-3 py-2">{lead.travellers ?? "—"}</td>
                <td className="px-3 py-2">{formatCurrency(lead.budget_max)}</td>
                <td className="px-3 py-2">{lead.lead_stages?.name || lead.stage?.name}</td>
                <td className="px-3 py-2">{formatIst(lead.first_response_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
