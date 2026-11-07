import { Badge, Card, PageHeader } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { formatIst } from "@/lib/reports/timezone";

export const instant = false;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePermission("audit.view");
  let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
  if (params.action) query = query.eq("action", params.action);
  if (params.entity) query = query.eq("entity_type", params.entity);
  if (params.source) query = query.eq("source", params.source);
  if (params.q) query = query.or(`entity_name.ilike.%${params.q}%,entity_id.eq.${params.q}`);
  const { data: events } = await query;

  return (
    <div>
      <PageHeader title="Audit log" description="Append-only business activity history. Ordinary users cannot edit or delete these records." />
      <form className="mb-4 grid gap-3 md:grid-cols-5">
        <input name="q" placeholder="Record name or ID" defaultValue={params.q} className="rounded-md border border-line px-3 py-2 text-sm" />
        <input name="action" placeholder="Action" defaultValue={params.action} className="rounded-md border border-line px-3 py-2 text-sm" />
        <input name="entity" placeholder="Entity" defaultValue={params.entity} className="rounded-md border border-line px-3 py-2 text-sm" />
        <input name="source" placeholder="Source" defaultValue={params.source} className="rounded-md border border-line px-3 py-2 text-sm" />
        <button className="rounded-md bg-accent px-3 py-2 text-sm text-white">Filter</button>
      </form>
      <div className="space-y-3">
        {(events ?? []).length ? (events ?? []).map((event) => (
          <Card key={event.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">{event.event_code || event.id}</p>
                <h2 className="font-medium">{event.action.replaceAll("_", " ")}</h2>
                <p className="text-sm text-muted">
                  {event.actor_name || event.actor_email || "System"} · {event.actor_role || "—"} · {event.entity_type} {event.entity_name || event.entity_id}
                </p>
              </div>
              <Badge>{event.source ?? "user"}</Badge>
            </div>
            <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
              <div><dt className="text-muted">When (IST)</dt><dd>{formatIst(event.created_at)}</dd></div>
              <div><dt className="text-muted">UTC</dt><dd>{event.created_at}</dd></div>
              {event.field_name ? <div><dt className="text-muted">Field</dt><dd>{event.field_name}</dd></div> : null}
              {event.previous_value || event.new_value ? (
                <>
                  <div><dt className="text-muted">Previous</dt><dd className="break-all">{event.previous_value ?? "—"}</dd></div>
                  <div><dt className="text-muted">New</dt><dd className="break-all">{event.new_value ?? "—"}</dd></div>
                </>
              ) : null}
            </dl>
          </Card>
        )) : (
          <Card>No audit events match the current filters.</Card>
        )}
      </div>
    </div>
  );
}
