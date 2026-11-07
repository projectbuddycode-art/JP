import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { formatIst } from "@/lib/reports/timezone";

export const instant = false;

export default async function WebsiteEnquiriesPage() {
  const { supabase } = await requirePermission("content.publish");
  const { data: leads } = await supabase
    .from("leads")
    .select("id, full_name, destination, source, landing_page, utm_source, utm_campaign, package_id, created_at, owner_id")
    .in("source", ["website", "website_form"])
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <div>
      <PageHeader title="Website enquiries" description="These records are CRM leads, not a separate website inbox." />
      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-muted">
              <th className="py-2">Lead</th>
              <th>Destination</th>
              <th>Landing</th>
              <th>UTM</th>
              <th>When (IST)</th>
            </tr>
          </thead>
          <tbody>
            {(leads ?? []).map((lead) => (
              <tr key={lead.id} className="border-t border-line">
                <td className="py-2"><Link href={`/leads/${lead.id}`}>{lead.full_name}</Link></td>
                <td>{lead.destination}</td>
                <td>{lead.landing_page}</td>
                <td>{lead.utm_source} {lead.utm_campaign}</td>
                <td>{formatIst(lead.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
