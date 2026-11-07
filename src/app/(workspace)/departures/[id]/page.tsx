import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addIncidentAction,
  addItineraryDayAction,
  addTravellerAction,
  assignSupplierAction,
  recordExpenseAction,
  toggleChecklistAction,
} from "@/app/actions/ops";
import { Button, Card, Input, PageHeader, Textarea } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { formatCurrency, formatDate } from "@/lib/utils";
import { READINESS_LABEL, readinessStatus } from "@/lib/ops/readiness";
import { tripProfitability } from "@/lib/ops/finance";
import { canAccessDeparture } from "@/lib/ops/access";

export const instant = false;

export default async function DepartureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireActiveProfile();
  const { data: departure } = await supabase.from("departures").select("*").eq("id", id).maybeSingle();
  if (!departure) notFound();
  if (!canAccessDeparture(profile, departure)) notFound();
  const [
    { data: travellers },
    { data: bookings },
    { data: checklist },
    { data: days },
    { data: suppliers },
    { data: assignments },
    { data: expenses },
    { data: payments },
    { data: incidents },
  ] = await Promise.all([
    supabase.from("departure_travellers").select("*").eq("departure_id", id),
    supabase.from("bookings").select("*").eq("departure_id", id),
    supabase.from("departure_checklist").select("*").eq("departure_id", id),
    supabase.from("itinerary_days").select("*").eq("departure_id", id).order("day_number"),
    supabase.from("suppliers").select("id, name, kind").eq("active", true),
    supabase.from("departure_suppliers").select("*, supplier:suppliers(name)").eq("departure_id", id),
    supabase.from("trip_expenses").select("*").eq("departure_id", id),
    supabase.from("booking_payments").select("*").in("booking_id", ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("trip_incidents").select("*").eq("departure_id", id).order("created_at", { ascending: false }),
  ]);
  const bookingIds = (bookings ?? []).map((item) => item.id);
  const { data: allPayments } = bookingIds.length
    ? await supabase.from("booking_payments").select("*").in("booking_id", bookingIds)
    : { data: [] };
  const finance = tripProfitability({
    bookings: bookings ?? [],
    payments: allPayments ?? payments ?? [],
    supplierCosts: assignments ?? [],
    expenses: expenses ?? [],
  });
  const ready = readinessStatus(checklist ?? []);
  const pax = (travellers ?? []).length;

  return (
    <div>
      <PageHeader
        title={departure.name}
        description={`${departure.destination ?? ""} · ${formatDate(departure.start_date)} – ${formatDate(departure.end_date)} · ${READINESS_LABEL[ready]}`}
        actions={<Link className="rounded-md bg-accent px-3 py-2 text-sm text-white" href={`/departures/${id}/live`}>Trip leader view</Link>}
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Card><p className="text-sm text-muted">Travellers</p><p className="font-serif text-3xl">{pax} / {departure.capacity}</p></Card>
        <Card><p className="text-sm text-muted">Collected</p><p className="font-serif text-3xl">{formatCurrency(finance.collected)}</p></Card>
        <Card><p className="text-sm text-muted">Outstanding</p><p className="font-serif text-3xl">{formatCurrency(finance.outstanding)}</p></Card>
        <Card><p className="text-sm text-muted">Recorded profit</p><p className="font-serif text-3xl">{formatCurrency(finance.actualProfit)}</p></Card>
      </div>
      <p className="mt-2 text-xs text-muted">Profit uses collected payments minus recorded supplier advances and expenses. Promised booking value is not treated as cash.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-xl">Readiness</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(checklist ?? []).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2">
                <span>{item.critical ? "• " : ""}{item.label}</span>
                <form action={toggleChecklistAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="completed" value={item.completed ? "false" : "true"} />
                  <Button variant="ghost" type="submit">{item.completed ? "Done" : "Mark"}</Button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Travellers</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {(travellers ?? []).map((person) => (
              <li key={person.id}>{person.full_name} · {person.phone_e164 || "no phone"} · {person.attendance}</li>
            ))}
          </ul>
          <form action={addTravellerAction} className="mt-4 space-y-2">
            <input type="hidden" name="departure_id" value={id} />
            <Input name="full_name" placeholder="Full name" required />
            <Input name="phone" placeholder="Phone" />
            <Input name="emergency_contact" placeholder="Emergency contact" />
            <Button type="submit">Add traveller</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Itinerary</h2>
          <ol className="mt-3 space-y-2 text-sm">
            {(days ?? []).map((day) => (
              <li key={day.id}>Day {day.day_number}: {day.location} — {day.activities}<span className="block text-xs text-muted">{day.internal_notes}</span></li>
            ))}
          </ol>
          <form action={addItineraryDayAction} className="mt-4 space-y-2">
            <input type="hidden" name="departure_id" value={id} />
            <Input name="day_number" type="number" defaultValue={(days?.length ?? 0) + 1} />
            <Input name="location" placeholder="Location" />
            <Textarea name="activities" placeholder="Customer-facing activities" rows={2} />
            <Textarea name="internal_notes" placeholder="Internal ops notes (not shown on website)" rows={2} />
            <Button type="submit">Add day</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Suppliers</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {(assignments ?? []).map((row) => (
              <li key={row.id}>{row.supplier?.name || row.service} · {row.status} · {formatCurrency(row.agreed_cost)}</li>
            ))}
          </ul>
          <form action={assignSupplierAction} className="mt-4 space-y-2">
            <input type="hidden" name="departure_id" value={id} />
            <select name="supplier_id" className="w-full rounded-md border border-line px-3 py-2 text-sm">
              {(suppliers ?? []).map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name} ({supplier.kind})</option>
              ))}
            </select>
            <Input name="service" placeholder="Service" />
            <Input name="agreed_cost" type="number" placeholder="Agreed cost" />
            <Button type="submit">Assign</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Expenses</h2>
          <ul className="mt-3 text-sm">
            {(expenses ?? []).map((row) => (
              <li key={row.id}>{row.category} · {formatCurrency(row.amount)}</li>
            ))}
          </ul>
          <form action={recordExpenseAction} className="mt-4 space-y-2">
            <input type="hidden" name="departure_id" value={id} />
            <Input name="category" placeholder="hotels / vehicles / meals" />
            <Input name="amount" type="number" required />
            <Button type="submit">Record expense</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Live notes / incidents</h2>
          <ul className="mt-3 text-sm">
            {(incidents ?? []).map((row) => (
              <li key={row.id}>{row.body}</li>
            ))}
          </ul>
          <form action={addIncidentAction} className="mt-4 space-y-2">
            <input type="hidden" name="departure_id" value={id} />
            <Textarea name="body" rows={3} placeholder="No GPS tracking unless a real location provider is connected." />
            <Button type="submit">Log note</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
