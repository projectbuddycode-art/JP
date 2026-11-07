import { Card, PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { profileRole } from "@/lib/auth/permissions";
import { managementSnapshot } from "@/lib/reports/intelligence";
import { formatCurrency } from "@/lib/utils";

export const instant = false;

export default async function PartnersPage() {
  const { supabase, profile } = await requireActiveProfile();
  const role = profileRole(profile);
  const { data: people } = await supabase
    .from("profiles")
    .select("id, full_name, email, workspace_role, role, status")
    .in("workspace_role", ["partner", "sales", "admin", "owner"]);
  const { data: leads } = await supabase.from("leads").select("*, lead_stages(*)").is("archived_at", null).limit(500);
  const { data: bookings } = await supabase.from("bookings").select("*").limit(500);
  const { data: tasks } = await supabase.from("tasks").select("*").limit(500);
  const scopedPeople = role === "partner" ? (people ?? []).filter((person) => person.id === profile.id) : people ?? [];

  return (
    <div>
      <PageHeader
        title="Partner performance"
        description="Compare activity, not just conversion. Partners with fewer or lower-quality leads are not ranked as underperformers solely on volume."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {scopedPeople.map((person) => {
          const owned = (leads ?? []).filter((lead) => lead.owner_id === person.id);
          const ownedBookings = (bookings ?? []).filter(
            (booking) => booking.partner_id === person.id || booking.owner_id === person.id || owned.some((lead) => lead.id === booking.lead_id),
          );
          const ownedTasks = (tasks ?? []).filter((task) => task.assigned_to === person.id);
          const snap = managementSnapshot(owned, ownedBookings, ownedTasks);
          return (
            <Card key={person.id}>
              <h2 className="font-serif text-xl">{person.full_name || person.email}</h2>
              <p className="text-sm text-muted">{person.workspace_role || person.role}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div><dt className="text-muted">Assigned leads</dt><dd>{owned.length}</dd></div>
                <div><dt className="text-muted">Qualified</dt><dd>{snap.qualified}</dd></div>
                <div><dt className="text-muted">Confirmed bookings</dt><dd>{snap.confirmed}</dd></div>
                <div><dt className="text-muted">Cancelled</dt><dd>{snap.cancelled}</dd></div>
                <div><dt className="text-muted">Recorded value</dt><dd>{formatCurrency(snap.recordedRevenue)}</dd></div>
                <div><dt className="text-muted">Cash received</dt><dd>{formatCurrency(snap.cashReceived)}</dd></div>
                <div><dt className="text-muted">Conversion</dt><dd>{Math.round(snap.conversion * 100)}%</dd></div>
                <div><dt className="text-muted">Overdue follow-ups</dt><dd>{snap.overdueFollowUps}</dd></div>
              </dl>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
