import Link from "next/link";
import { createDepartureAction } from "@/app/actions/ops";
import { Button, Card, Input, Label, PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { profileRole } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/utils";
import { READINESS_LABEL, readinessStatus } from "@/lib/ops/readiness";

export const instant = false;

export default async function DeparturesPage() {
  const { supabase, profile } = await requireActiveProfile();
  const [{ data: departures }, { data: packages }, { data: bookings }, { data: checklist }] = await Promise.all([
    supabase.from("departures").select("*").order("start_date"),
    supabase.from("packages").select("id, name"),
    supabase.from("bookings").select("id, departure_id, travellers, booking_status"),
    supabase.from("departure_checklist").select("departure_id, item_key, critical, completed"),
  ]);
  return (
    <div>
      <PageHeader
        title="Trips & departures"
        description="A package is a reusable itinerary. A departure is a dated group with seats, travellers, and suppliers."
      />
      <Card>
        <h2 className="font-serif text-xl">Create departure</h2>
        <form action={createDepartureAction} className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2"><Label>Name</Label><Input name="name" required placeholder="Spiti June 10 group" /></div>
          <div><Label>Start date</Label><Input name="start_date" type="date" required /></div>
          <div><Label>End date</Label><Input name="end_date" type="date" /></div>
          <div><Label>Destination</Label><Input name="destination" placeholder="Spiti Valley" /></div>
          <div>
            <Label>Package</Label>
            <select name="package_id" className="w-full rounded-md border border-line px-3 py-2 text-sm">
              <option value="">None</option>
              {(packages ?? []).map((pack) => (
                <option key={pack.id} value={pack.id}>{pack.name}</option>
              ))}
            </select>
          </div>
          <div><Label>Capacity</Label><Input name="capacity" type="number" defaultValue={12} /></div>
          <div className="flex items-end"><Button type="submit">Save departure</Button></div>
        </form>
      </Card>
      <div className="mt-6 overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-accent-soft text-muted">
            <tr>
              <th className="px-3 py-2">Departure</th>
              <th className="px-3 py-2">Dates</th>
              <th className="px-3 py-2">Seats</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Readiness</th>
            </tr>
          </thead>
          <tbody>
            {(departures ?? [])
            .filter((item) => profileRole(profile) !== "trip_leader" || item.trip_leader_id === profile.id)
            .map((item) => {
              const linked = (bookings ?? []).filter((booking) => booking.departure_id === item.id && booking.booking_status !== "cancelled");
              const pax = linked.reduce((sum, booking) => sum + Number(booking.travellers ?? 0), 0);
              const ready = readinessStatus((checklist ?? []).filter((row) => row.departure_id === item.id));
              return (
                <tr key={item.id} className="border-t border-line">
                  <td className="px-3 py-2">
                    <Link className="text-accent" href={`/departures/${item.id}`}>{item.name}</Link>
                    <div className="text-xs text-muted">{item.destination}</div>
                  </td>
                  <td className="px-3 py-2">{formatDate(item.start_date)} – {formatDate(item.end_date)}</td>
                  <td className="px-3 py-2">{pax} / {item.capacity} ({Math.max(0, item.capacity - pax)} open)</td>
                  <td className="px-3 py-2">{item.status}</td>
                  <td className="px-3 py-2">{READINESS_LABEL[ready]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!(departures ?? []).length ? <p className="px-3 py-6 text-sm text-muted">No dated departures yet. Packages remain on the website independently.</p> : null}
      </div>
    </div>
  );
}
