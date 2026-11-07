import { retryIntegrationEventAction } from "@/app/actions/integrations";
import { Button, Card, PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utils";
import { profileRole } from "@/lib/auth/permissions";

export const instant = false;

export default async function DeliveryMonitorPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>;
}) {
  const { supabase, profile } = await requireActiveProfile();
  const { provider } = await searchParams;
  let query = supabase.from("integration_events").select("*").order("received_at", { ascending: false }).limit(100);
  if (provider) query = query.eq("provider", provider);
  const { data: events } = await query;
  const rows = events ?? [];
  const counts = {
    total: rows.length,
    processed: rows.filter((item) => item.outcome === "processed" || item.status === "processed").length,
    failed: rows.filter((item) => item.status === "failed" || item.outcome === "failed").length,
    pending: rows.filter((item) => item.outcome === "pending_fields" || item.status === "received").length,
    duplicates: rows.filter((item) => item.outcome === "duplicate").length,
    ignored: rows.filter((item) => item.outcome === "ignored").length,
    leads: rows.filter((item) => item.lead_id).length,
  };
  const owner = profileRole(profile) === "owner" || profileRole(profile) === "admin";
  return (
    <div>
      <PageHeader title="Lead delivery monitor" description="Durable ingest log. Quiet periods are not treated as outages unless a health check fails." />
      <div className="grid gap-3 md:grid-cols-4">
        {Object.entries(counts).map(([label, value]) => (
          <Card key={label}><p className="text-sm text-muted">{label}</p><p className="font-serif text-3xl">{value}</p></Card>
        ))}
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-accent-soft text-muted">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Provider</th>
              <th className="px-3 py-2">Event</th>
              <th className="px-3 py-2">Outcome</th>
              <th className="px-3 py-2">Step</th>
              <th className="px-3 py-2">Error</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((event) => (
              <tr key={event.id} className="border-t border-line">
                <td className="px-3 py-2">{formatDateTime(event.received_at)}</td>
                <td className="px-3 py-2">{event.provider}</td>
                <td className="px-3 py-2">{event.event_id}</td>
                <td className="px-3 py-2">{event.outcome || event.status}</td>
                <td className="px-3 py-2">{event.processing_step}</td>
                <td className="px-3 py-2 text-danger">{event.error_detail}</td>
                <td className="px-3 py-2">
                  {owner && event.outcome !== "ignored" && event.status !== "processed" ? (
                    <form action={retryIntegrationEventAction}>
                      <input type="hidden" name="event_id" value={event.id} />
                      <Button variant="ghost" type="submit">Retry</Button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
