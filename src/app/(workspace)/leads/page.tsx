import Link from "next/link";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { LeadForm } from "@/components/lead-form";
import { CsvImport } from "@/components/csv-import";
import { requireActiveProfile } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";

export const instant = false;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; destination?: string; new?: string; source?: string; unassigned?: string; review?: string }>;
}) {
  const { supabase } = await requireActiveProfile();
  const params = await searchParams;
  let query = supabase
    .from("leads")
    .select("*, stage:lead_stages(name, slug), owner:profiles(full_name)")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  if (params.q) {
    query = query.or(
      `full_name.ilike.%${params.q}%,email.ilike.%${params.q}%,phone_e164.ilike.%${params.q}%,destination.ilike.%${params.q}%,source.ilike.%${params.q}%`,
    );
  }
  if (params.destination) query = query.eq("destination", params.destination);
  if (params.source) query = query.eq("source", params.source);
  if (params.unassigned === "1") query = query.is("owner_id", null);
  if (params.review === "1") query = query.eq("needs_review", true);
  const { data: leads } = await query;

  return (
    <div>
      <PageHeader
        title="Lead inbox"
        description="Every channel writes here. A lead is not a booking until it is confirmed in Bookings & Payments."
      />
      <form className="mb-4 flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={params.q} placeholder="Search" className="rounded-md border border-line px-3 py-2" />
        <input name="source" defaultValue={params.source} placeholder="Source" className="rounded-md border border-line px-3 py-2" />
        <input name="destination" defaultValue={params.destination} placeholder="Destination" className="rounded-md border border-line px-3 py-2" />
        <label className="flex items-center gap-1"><input type="checkbox" name="unassigned" value="1" defaultChecked={params.unassigned === "1"} /> Unassigned</label>
        <label className="flex items-center gap-1"><input type="checkbox" name="review" value="1" defaultChecked={params.review === "1"} /> Duplicate review</label>
        <button className="rounded-md border border-line px-3 py-2">Filter</button>
      </form>
      {params.new ? (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <LeadForm />
          <CsvImport />
        </div>
      ) : (
        <div className="mb-4">
          <Link href="/leads?new=1" className="text-sm text-accent">
            New lead / CSV import
          </Link>
        </div>
      )}
      {!leads?.length ? (
        <EmptyState title="No leads yet" body="Create a lead, import a CSV, or connect a lead form." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Received</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-line/70">
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} className="font-medium">
                      {lead.full_name ?? "Unnamed"}
                    </Link>
                    <p className="text-xs text-muted">{lead.phone_e164 ?? lead.email}</p>
                    {lead.is_test ? <Badge tone="warn">test event</Badge> : null}
                  </td>
                  <td className="px-4 py-3">{lead.source_type || lead.source || "—"}{lead.provider ? ` · ${lead.provider}` : ""}</td>
                  <td className="px-4 py-3">{lead.destination ?? "—"}</td>
                  <td className="px-4 py-3">{lead.owner?.full_name ?? "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <Badge>{lead.stage?.name ?? "—"}</Badge>
                  </td>
                  <td className="px-4 py-3">{formatDate(lead.received_at || lead.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
