import { recordPaymentAction, linkBookingDepartureAction } from "@/app/actions/ops";
import { Badge, Button, EmptyState, Input, PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { formatCurrency, formatDate } from "@/lib/utils";

export const instant = false;

export default async function BookingsPage() {
  const { supabase } = await requireActiveProfile();
  const [{ data: bookings }, { data: departures }] = await Promise.all([
    supabase.from("bookings").select("*, contact:contacts(full_name), package:packages(name)").order("created_at", { ascending: false }),
    supabase.from("departures").select("id, name").order("start_date"),
  ]);
  return (
    <div>
      <PageHeader
        title="Bookings & payments"
        description="A confirmed booking is separate from a lead. Card numbers are never stored. Recorded payments are the cash figure."
      />
      {!bookings?.length ? (
        <EmptyState title="No bookings" body="Confirm a booking from an accepted proposal or an explicit lead action." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="min-w-full text-sm">
            <thead className="border-b border-line text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Reference</th>
                <th className="px-4 py-3 text-left">Guest</th>
                <th className="px-4 py-3 text-left">Package</th>
                <th className="px-4 py-3 text-left">Dates</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-line/70">
                  <td className="px-4 py-3">{booking.booking_reference}</td>
                  <td className="px-4 py-3">{booking.contact?.full_name ?? "—"}</td>
                  <td className="px-4 py-3">{booking.package?.name ?? "Custom"}</td>
                  <td className="px-4 py-3">{formatDate(booking.travel_start)}</td>
                  <td className="px-4 py-3">
                    {formatCurrency(booking.amount_received ?? booking.amount_paid ?? 0, booking.currency)}
                    <span className="block text-xs text-muted">of {formatCurrency(booking.confirmed_amount, booking.currency)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={booking.booking_status === "confirmed" ? "success" : "default"}>
                      {booking.booking_status} / {booking.payment_status}
                    </Badge>
                    <form action={recordPaymentAction} className="mt-2 flex gap-1">
                      <input type="hidden" name="booking_id" value={booking.id} />
                      <Input name="amount" type="number" placeholder="Amount" className="h-8 w-24" />
                      <Button type="submit" variant="secondary">Record</Button>
                    </form>
                    <form action={linkBookingDepartureAction} className="mt-1">
                      <input type="hidden" name="booking_id" value={booking.id} />
                      <select name="departure_id" defaultValue={booking.departure_id ?? ""} className="rounded-md border border-line px-2 py-1 text-xs">
                        <option value="">No departure</option>
                        {(departures ?? []).map((item) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                      <button className="ml-1 text-xs text-accent">Link</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
