import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { LeadForm } from "@/components/lead-form";

export const instant = false;

export default async function SalesHubPage() {
  const { supabase } = await requireActiveProfile();
  const [{ count: leads }, { count: openTasks }, { data: stages }] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).is("archived_at", null),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("lead_stages").select("name, slug, sort_order").order("sort_order"),
  ]);
  return (
    <div>
      <PageHeader
        title="Enquiries & sales"
        description="Capture, assign, follow up, and quote. A lead is not a booking until it is confirmed in Bookings & Payments."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Card><p className="text-sm text-muted">Open enquiries</p><p className="font-serif text-3xl">{leads ?? 0}</p></Card>
        <Card><p className="text-sm text-muted">Open follow-ups</p><p className="font-serif text-3xl">{openTasks ?? 0}</p></Card>
      </div>
      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <Link className="rounded-md border border-line px-3 py-2" href="/leads">Lead inbox</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/leads/duplicates">Duplicate review</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/pipeline">Pipeline</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/contacts">Contacts</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/inbox">WhatsApp inbox</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/packages">Package catalogue</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/sales/retention">Repeat customers</Link>
      </div>
      <Card className="mt-6">
        <h2 className="font-serif text-xl">Sales stages</h2>
        <ol className="mt-3 grid gap-2 text-sm md:grid-cols-2">
          {(stages ?? []).map((stage) => (
            <li key={stage.slug}>{stage.sort_order}. {stage.name}</li>
          ))}
        </ol>
      </Card>
      <div className="mt-6 max-w-xl">
        <LeadForm />
      </div>
    </div>
  );
}
