import { notFound } from "next/navigation";
import Link from "next/link";
import { addIncidentAction, markAttendanceAction, recordExpenseAction } from "@/app/actions/ops";
import { Button, Card, Input, PageHeader, Textarea } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { canAccessDeparture } from "@/lib/ops/access";
import { formatDate } from "@/lib/utils";

export const instant = false;

export default async function LiveTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireActiveProfile();
  const { data: departure } = await supabase.from("departures").select("*").eq("id", id).maybeSingle();
  if (!departure) notFound();
  if (!canAccessDeparture(profile, departure)) notFound();
  const [{ data: days }, { data: travellers }, { data: assignments }, { data: incidents }] = await Promise.all([
    supabase.from("itinerary_days").select("*").eq("departure_id", id).order("day_number"),
    supabase.from("departure_travellers").select("*").eq("departure_id", id),
    supabase.from("departure_suppliers").select("*, supplier:suppliers(name, phone_e164, kind)").eq("departure_id", id),
    supabase.from("trip_incidents").select("*").eq("departure_id", id).order("created_at", { ascending: false }),
  ]);
  const today = days?.[0];
  return (
    <div className="mx-auto max-w-lg pb-16">
      <PageHeader
        title={departure.name}
        description={`Trip leader workspace · ${formatDate(departure.start_date)}. No GPS tracking unless a location provider is connected.`}
        actions={<Link className="text-sm text-accent" href={`/departures/${id}`}>Full ops</Link>}
      />
      <Card>
        <h2 className="font-serif text-xl">Today</h2>
        {today ? (
          <div className="mt-2 text-sm">
            <p className="font-medium">Day {today.day_number} · {today.location}</p>
            <p className="mt-1">{today.activities}</p>
            <p className="mt-2 text-muted">{today.internal_notes}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">No itinerary day recorded yet.</p>
        )}
      </Card>
      <Card className="mt-4">
        <h2 className="font-serif text-xl">Attendance</h2>
        <ul className="mt-3 space-y-3">
          {(travellers ?? []).map((person) => (
            <li key={person.id} className="rounded-md border border-line p-3">
              <p className="font-medium">{person.full_name}</p>
              <p className="text-sm text-muted">{person.phone_e164} · {person.emergency_contact || "no emergency contact"}</p>
              <form action={markAttendanceAction} className="mt-2 flex gap-2">
                <input type="hidden" name="id" value={person.id} />
                <select name="attendance" defaultValue={person.attendance} className="flex-1 rounded-md border border-line px-2 py-2 text-sm">
                  <option value="expected">Expected</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                </select>
                <Button type="submit">Save</Button>
              </form>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="mt-4">
        <h2 className="font-serif text-xl">Supplier contacts</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(assignments ?? []).map((row) => (
            <li key={row.id}>{row.supplier?.name || row.service} · {row.supplier?.kind} · {row.supplier?.phone_e164 || "no phone"}</li>
          ))}
          {!(assignments ?? []).length ? <li className="text-muted">No hotels, drivers or guides assigned.</li> : null}
        </ul>
      </Card>
      <Card className="mt-4">
        <h2 className="font-serif text-xl">Incident / assistance</h2>
        <ul className="mt-2 space-y-1 text-sm">{(incidents ?? []).map((row) => <li key={row.id}>{row.body}</li>)}</ul>
        <form action={addIncidentAction} className="mt-3 space-y-2">
          <input type="hidden" name="departure_id" value={id} />
          <Textarea name="body" rows={3} placeholder="Incident or request for the operations manager" />
          <Button type="submit">Send</Button>
        </form>
        <form action={recordExpenseAction} className="mt-4 space-y-2">
          <input type="hidden" name="departure_id" value={id} />
          <Input name="category" placeholder="Unexpected expense" />
          <Input name="amount" type="number" placeholder="Amount" />
          <Button type="submit" variant="secondary">Record expense</Button>
        </form>
      </Card>
    </div>
  );
}
