import { Card, PageHeader } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";

export const instant = false;

export default async function WebsiteAnalyticsPage() {
  const { supabase } = await requirePermission("content.publish");
  const [{ data: events }, { count: enquiries }] = await Promise.all([
    supabase.from("website_events").select("event_name, path, created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("leads").select("id", { count: "exact", head: true }).in("source", ["website", "website_form"]),
  ]);
  const counts = new Map<string, number>();
  for (const event of events ?? []) {
    counts.set(event.event_name, (counts.get(event.event_name) ?? 0) + 1);
  }
  const ga4 = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  return (
    <div>
      <PageHeader title="Website analytics" description="First-party CRM events only. Session counts from Google appear after GA4 is configured and consented." />
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm text-muted">Website enquiries</p><p className="font-serif text-3xl">{enquiries ?? 0}</p></Card>
        <Card><p className="text-sm text-muted">WhatsApp clicks</p><p className="font-serif text-3xl">{counts.get("whatsapp_click") ?? 0}</p></Card>
        <Card><p className="text-sm text-muted">Newsletter consents</p><p className="font-serif text-3xl">{counts.get("newsletter_subscribed") ?? 0}</p></Card>
      </div>
      <Card className="mt-6">
        <h2 className="font-serif text-xl">Google Analytics 4</h2>
        <p className="mt-2 text-sm text-muted">
          {ga4 ? `Measurement ID configured (${ga4}). Visitor sessions are not imported into this CRM yet.` : "Not configured. No visitor counts are displayed."}
        </p>
      </Card>
      <Card className="mt-6">
        <h2 className="font-serif text-xl">Event log</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {(events ?? []).map((event, index) => (
            <li key={`${event.event_name}-${index}`}>{event.event_name} · {event.path}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
