import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";

export const instant = false;

export default async function RetentionPage() {
  const { supabase } = await requireActiveProfile();
  const [{ data: contacts }, { data: leads }, { data: bookings }, { data: feedback }] = await Promise.all([
    supabase.from("contacts").select("id, full_name, phone_e164, email, consent_marketing"),
    supabase.from("leads").select("id, contact_id, destination, archived_at").is("archived_at", null),
    supabase.from("bookings").select("id, contact_id, booking_status, confirmed_amount"),
    supabase.from("customer_feedback").select("id, contact_id, score, created_at").limit(50),
  ]);
  const rows = (contacts ?? []).map((contact) => {
    const enquiries = (leads ?? []).filter((lead) => lead.contact_id === contact.id);
    const trips = (bookings ?? []).filter((booking) => booking.contact_id === contact.id && booking.booking_status !== "cancelled");
    return { contact, enquiries: enquiries.length, trips: trips.length, destinations: [...new Set(enquiries.map((item) => item.destination).filter(Boolean))] };
  }).filter((row) => row.enquiries > 1 || row.trips > 0);

  return (
    <div>
      <PageHeader title="Repeat customers" description="Contacts with more than one enquiry or a confirmed booking. Outreach still requires recorded consent." />
      <table className="w-full text-left text-sm">
        <thead className="bg-accent-soft text-muted">
          <tr>
            <th className="px-3 py-2">Customer</th>
            <th className="px-3 py-2">Enquiries</th>
            <th className="px-3 py-2">Bookings</th>
            <th className="px-3 py-2">Destinations</th>
            <th className="px-3 py-2">Marketing</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.contact.id} className="border-t border-line">
              <td className="px-3 py-2">{row.contact.full_name}<div className="text-xs text-muted">{row.contact.phone_e164}</div></td>
              <td className="px-3 py-2">{row.enquiries}</td>
              <td className="px-3 py-2">{row.trips}</td>
              <td className="px-3 py-2">{row.destinations.join(", ") || "—"}</td>
              <td className="px-3 py-2">{row.contact.consent_marketing ? "Consented" : "No marketing consent"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!(rows.length) ? <p className="mt-4 text-sm text-muted">No repeat records yet.</p> : null}
      <p className="mt-4 text-sm text-muted">Feedback rows stored: {(feedback ?? []).length}. <Link className="text-accent" href="/leads">Open inbox</Link></p>
    </div>
  );
}
