import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";

export const instant = false;

export default async function TravellersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const { supabase } = await requireActiveProfile();
  const { data: people } = await supabase
    .from("departure_travellers")
    .select("*, departure:departures(name, start_date)")
    .order("full_name");
  const csv = [
    "name,phone,emergency,departure",
    ...(people ?? []).map((person) =>
      [person.full_name, person.phone_e164 ?? "", person.emergency_contact ?? "", person.departure?.name ?? ""].join(","),
    ),
  ].join("\n");
  return (
    <div>
      <PageHeader
        title="Travellers"
        description="Manifest for confirmed departures. Identity documents are not stored as public URLs."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-md border border-line px-3 py-2 text-sm" href="/travellers">Manifest</Link>
            <Link className="rounded-md border border-line px-3 py-2 text-sm" href="/travellers?view=rooms">Rooms</Link>
            <Link className="rounded-md border border-line px-3 py-2 text-sm" href="/travellers?view=pickup">Pickup</Link>
            <Link className="rounded-md border border-line px-3 py-2 text-sm" href="/travellers?view=emergency">Emergency</Link>
            <a
              className="rounded-md border border-line px-3 py-2 text-sm"
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
              download="traveller-manifest.csv"
            >
              Export CSV
            </a>
          </div>
        }
      />
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-accent-soft text-muted">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Emergency</th>
              <th className="px-3 py-2">{view === "pickup" ? "Arrival" : view === "emergency" ? "Emergency" : "Room"}</th>
              <th className="px-3 py-2">Departure</th>
            </tr>
          </thead>
          <tbody>
            {(people ?? []).map((person) => (
              <tr key={person.id} className="border-t border-line">
                <td className="px-3 py-2">{person.full_name}</td>
                <td className="px-3 py-2">{person.phone_e164}</td>
                <td className="px-3 py-2">{person.emergency_contact}</td>
                <td className="px-3 py-2">{view === "pickup" ? person.arrival_details : person.room_preference}</td>
                <td className="px-3 py-2">
                  {person.departure_id ? <Link href={`/departures/${person.departure_id}`}>{person.departure?.name}</Link> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!(people ?? []).length ? <p className="px-3 py-6 text-sm text-muted">No travellers yet. Add them from a departure after a booking is confirmed.</p> : null}
      </div>
    </div>
  );
}
