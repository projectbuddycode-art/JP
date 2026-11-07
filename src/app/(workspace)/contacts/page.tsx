import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";

export const instant = false;

export default async function ContactsPage() {
  const { supabase } = await requireActiveProfile();
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, full_name, phone_e164, email, city, consent_marketing")
    .order("created_at", { ascending: false })
    .limit(200);
  const { data: leads } = await supabase.from("leads").select("id, contact_id, destination").is("archived_at", null);

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="A person can hold several trip enquiries. Matching is by phone or email, never by name alone."
      />
      {!contacts?.length ? (
        <EmptyState title="No contacts" body="Contacts are created when leads are captured." />
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => {
            const related = (leads ?? []).filter((lead) => lead.contact_id === contact.id);
            return (
              <div key={contact.id} className="rounded-xl border border-line bg-surface p-4">
                <p className="font-medium">{contact.full_name ?? "Unnamed contact"}</p>
                <p className="text-sm text-muted">{contact.phone_e164 ?? contact.email}</p>
                <p className="mt-2 text-sm">
                  {related.length} trip enquir{related.length === 1 ? "y" : "ies"}
                  {related.length ? `: ${related.map((item) => item.destination ?? "unspecified").join(", ")}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  {related.map((lead) => (
                    <Link key={lead.id} href={`/leads/${lead.id}`} className="text-accent">
                      Open lead
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
