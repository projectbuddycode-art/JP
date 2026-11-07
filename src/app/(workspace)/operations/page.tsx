import { saveSupplierAction } from "@/app/actions/ops";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { profileRole } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";

export const instant = false;

export default async function OperationsPage() {
  const { supabase, profile } = await requireActiveProfile();
  if (!["owner", "admin", "trip_leader", "finance", "operations_manager"].includes(profileRole(profile))) redirect("/overview");
  const { data: suppliers } = await supabase.from("suppliers").select("*").limit(50);
  const { data: trips } = await supabase.from("trip_operations").select("*").limit(50);
  const { data: upcoming } = await supabase.from("departures").select("id, name, start_date, status").neq("status", "cancelled").order("start_date").limit(20);
  return (
    <div>
      <PageHeader title="Operations & suppliers" description="Hotels, drivers, guides and other trip services. Assign them on a departure, not as generic CRM records." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-xl">Upcoming trips</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(upcoming ?? []).map((item) => (
              <li key={item.id}><Link href={`/departures/${item.id}`}>{item.name}</Link> · {item.start_date} · {item.status}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Add supplier</h2>
          <form action={saveSupplierAction} className="mt-3 space-y-2">
            <Input name="name" placeholder="Business name" required />
            <select name="kind" className="w-full rounded-md border border-line px-3 py-2 text-sm">
              <option value="hotel">Hotel</option>
              <option value="homestay">Homestay</option>
              <option value="driver">Driver</option>
              <option value="transport">Transport</option>
              <option value="guide">Guide</option>
              <option value="activity">Activity</option>
            </select>
            <Input name="location" placeholder="Location" />
            <Input name="phone" placeholder="Phone" />
            <Button type="submit">Save supplier</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Suppliers</h2>
          {(suppliers ?? []).length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {(suppliers ?? []).map((supplier) => (
                <li key={supplier.id}>{supplier.name} · {supplier.kind}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No suppliers yet. Add hotels, drivers, and guides after applying migration 0003.</p>
          )}
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="font-serif text-xl">Operational records</h2>
          {(trips ?? []).length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {(trips ?? []).map((trip) => (
                <li key={trip.id}>{trip.id} · {trip.status ?? "draft"}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">Trip checklists appear here when a confirmed booking is prepared for departure.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
