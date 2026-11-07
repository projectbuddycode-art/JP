import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";

export const instant = false;

export default async function DuplicateReviewPage() {
  const { supabase } = await requireActiveProfile();
  const { data: leads } = await supabase
    .from("leads")
    .select("id, full_name, phone_e164, email, source, destination, needs_review, created_at")
    .eq("needs_review", true)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  return (
    <div>
      <PageHeader title="Duplicate review" description="Phone and email matched different contacts. Names are never merged automatically." />
      <ul className="space-y-2 text-sm">
        {(leads ?? []).map((lead) => (
          <li key={lead.id} className="rounded-md border border-line p-3">
            <Link className="text-accent" href={`/leads/${lead.id}`}>{lead.full_name || lead.phone_e164}</Link>
            <span className="text-muted"> · {lead.phone_e164} · {lead.email} · {lead.source} · {lead.destination}</span>
          </li>
        ))}
        {!(leads ?? []).length ? <li className="text-muted">No ambiguous identity matches right now.</li> : null}
      </ul>
    </div>
  );
}
