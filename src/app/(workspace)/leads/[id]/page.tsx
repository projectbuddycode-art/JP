import { notFound } from "next/navigation";
import { addNoteAction, confirmBookingAction, createProposalAction, createTaskAction, logCallAction } from "@/app/actions/crm";
import { scoreLead } from "@/lib/crm/score";
import { assignLeadAction } from "@/app/actions/team";
import { archiveLeadAction } from "@/app/actions/import";
import { Badge, Button, Card, Input, Label, PageHeader, Textarea } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { suggestNextAction } from "@/lib/crm/next-action";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { requestNow } from "@/lib/now";

export const instant = false;

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireActiveProfile();
  const now = await requestNow();
  const { data: lead } = await supabase
    .from("leads")
    .select("*, stage:lead_stages(*), contact:contacts(*)")
    .eq("id", id)
    .maybeSingle();
  if (!lead) notFound();
  const [{ data: activities }, { data: tasks }, { data: proposals }, { data: bookings }, { data: packages }, { data: members }, { data: history }] =
    await Promise.all([
      supabase.from("activities").select("*").eq("lead_id", id).order("created_at", { ascending: false }).limit(50),
      supabase.from("tasks").select("*").eq("lead_id", id).order("due_at", { ascending: true }),
      supabase.from("proposals").select("*").eq("lead_id", id),
      supabase.from("bookings").select("*").eq("lead_id", id),
      supabase.from("packages").select("id, name, destination, status").eq("status", "published"),
      supabase.from("profiles").select("id, full_name, email, workspace_role").eq("status", "active"),
      supabase.from("audit_logs").select("*").eq("entity_id", id).order("created_at", { ascending: false }).limit(30),
    ]);
  const suggestion = suggestNextAction({
    stageSlug: lead.stage?.slug ?? "new_enquiry",
    hasPhone: Boolean(lead.phone_e164),
    hasEmail: Boolean(lead.email),
    lastInteractionAt: lead.last_interaction_at,
    nextFollowUpAt: lead.next_follow_up_at,
    hasQuote: (proposals ?? []).length > 0,
    quoteStatus: proposals?.[0]?.status,
    missingFields: [
      !lead.destination ? "destination" : "",
      !lead.preferred_start ? "travel_dates" : "",
      !lead.travellers ? "travellers" : "",
    ].filter(Boolean),
    consentMarketing: Boolean(lead.contact?.consent_marketing),
    staleDays: lead.last_interaction_at
      ? Math.floor((now.getTime() - new Date(lead.last_interaction_at).getTime()) / 86_400_000)
      : 30,
    isLost: Boolean(lead.stage?.is_lost),
    isWon: Boolean(lead.stage?.is_won),
  });
  const scored = scoreLead({
    hasPhone: Boolean(lead.phone_e164),
    hasEmail: Boolean(lead.email),
    destination: lead.destination,
    preferredStart: lead.preferred_start,
    travellers: lead.travellers,
    budget: lead.budget_max,
    source: lead.source,
    stageProbability: lead.stage?.probability,
    isLost: Boolean(lead.stage?.is_lost),
  });

  return (
    <div>
      <PageHeader
        title={lead.full_name ?? "Lead"}
        description={`${lead.destination ?? "Destination not set"} · ${lead.source ?? "unknown source"}`}
        actions={
          <form action={archiveLeadAction.bind(null, lead.id)}>
            <Button variant="secondary">Archive</Button>
          </form>
        }
      />
      <div className="mb-6 rounded-xl border border-line bg-accent-soft p-4">
        <p className="text-sm uppercase tracking-wide text-muted">Next best action</p>
        <p className="mt-1 font-medium">{suggestion.action}</p>
        <p className="mt-2 text-sm">Qualification score {scored.score}/100</p>
        <p className="text-xs text-muted">{scored.reasons.join(" · ") || "No scoring fields yet"}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="font-serif text-xl">Profile</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted">Phone</dt><dd>{lead.phone_e164 ?? "—"}</dd></div>
            <div><dt className="text-muted">Email</dt><dd>{lead.email ?? "—"}</dd></div>
            <div><dt className="text-muted">Dates</dt><dd>{formatDate(lead.preferred_start)} – {formatDate(lead.preferred_end)}</dd></div>
            <div><dt className="text-muted">Travellers</dt><dd>{lead.travellers ?? "—"}</dd></div>
            <div><dt className="text-muted">Budget</dt><dd>{formatCurrency(lead.budget_max, lead.currency)}</dd></div>
            <div><dt className="text-muted">Stage</dt><dd><Badge>{lead.stage?.name}</Badge></dd></div>
            <div><dt className="text-muted">Contact record</dt><dd>{lead.contact_id}</dd></div>
            <div><dt className="text-muted">Test event</dt><dd>{lead.is_test ? "Yes" : "No"}</dd></div>
            <div><dt className="text-muted">Source</dt><dd>{lead.source_type || lead.source || "—"}</dd></div>
            <div><dt className="text-muted">Provider</dt><dd>{lead.provider || "—"} · {lead.provider_account_id || "no account"}</dd></div>
            <div><dt className="text-muted">Provider lead</dt><dd>{lead.provider_lead_id || lead.source_record_id || "—"}</dd></div>
            <div><dt className="text-muted">Campaign</dt><dd>{lead.campaign_name || lead.utm_campaign || "—"}</dd></div>
            <div><dt className="text-muted">Landing page</dt><dd>{lead.landing_page || "—"}</dd></div>
          </dl>
          <form action={assignLeadAction} className="mt-4 space-y-2">
            <input type="hidden" name="lead_id" value={lead.id} />
            <Label>Assign partner</Label>
            <select name="owner_id" defaultValue={lead.owner_id ?? ""} className="w-full rounded-md border border-line px-3 py-2 text-sm">
              {(members ?? []).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name || member.email} ({member.workspace_role || "member"})
                </option>
              ))}
            </select>
            <Button variant="secondary" type="submit">Reassign</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Add note</h2>
          <form action={addNoteAction} className="mt-3 space-y-3">
            <input type="hidden" name="lead_id" value={lead.id} />
            <Textarea name="body" rows={4} required />
            <Button type="submit">Save note</Button>
          </form>
          <form action={logCallAction} className="mt-4 space-y-3">
            <input type="hidden" name="lead_id" value={lead.id} />
            <Label>Call log</Label>
            <Textarea name="body" rows={3} required placeholder="Outcome of the call. This is not call recording." />
            <Button type="submit" variant="secondary">Log call</Button>
          </form>
          <form action={createTaskAction} className="mt-6 space-y-3">
            <input type="hidden" name="lead_id" value={lead.id} />
            <Label>Follow-up task</Label>
            <Input name="title" defaultValue="Follow up" />
            <Input name="due_at" type="datetime-local" />
            <Button type="submit" variant="secondary">Create task</Button>
          </form>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-xl">Proposal</h2>
          <form action={createProposalAction} className="mt-3 space-y-3">
            <input type="hidden" name="lead_id" value={lead.id} />
            <Label>Package</Label>
            <select name="package_id" className="w-full rounded-md border border-line px-3 py-2 text-sm">
              <option value="">None</option>
              {(packages ?? []).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <Input name="title" placeholder="Proposal title" />
            <Input name="amount" type="number" placeholder="Quoted amount" />
            <Textarea name="body" rows={4} placeholder="Itinerary notes. Do not invent availability." />
            <Button type="submit">Create proposal</Button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {(proposals ?? []).map((item) => (
              <li key={item.id} className="rounded-md border border-line p-3">
                {item.title} · {item.status} · {formatCurrency(item.amount, item.currency)}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Confirm booking</h2>
          <p className="text-sm text-muted">A booking is confirmed only when you record this explicit action.</p>
          <form action={confirmBookingAction} className="mt-3 space-y-3">
            <input type="hidden" name="lead_id" value={lead.id} />
            <Input name="confirmed_amount" type="number" required placeholder="Confirmed amount" />
            <Button type="submit">Confirm booking</Button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {(bookings ?? []).map((item) => (
              <li key={item.id}>{item.booking_reference} · {item.booking_status}</li>
            ))}
          </ul>
        </Card>
      </div>
      <Card className="mt-6">
        <h2 className="font-serif text-xl">Activity timeline</h2>
        <ol className="mt-4 space-y-3">
          {(activities ?? []).map((item) => (
            <li key={item.id} className="border-l-2 border-line pl-3 text-sm">
              <p className="font-medium">{item.type}</p>
              <p className="text-muted">{item.body}</p>
              <p className="text-xs text-muted">{formatDateTime(item.created_at)}</p>
            </li>
          ))}
        </ol>
        <h3 className="mt-6 font-medium">Change history</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {(history ?? []).map((event) => (
            <li key={event.id}>
              {event.action} · {event.actor_name || event.actor_email || "system"} · {formatDateTime(event.created_at)}
              {event.previous_value || event.new_value ? ` · ${event.previous_value ?? "—"} → ${event.new_value ?? "—"}` : ""}
            </li>
          ))}
        </ul>
        <h3 className="mt-6 font-medium">Open tasks</h3>
        <ul className="mt-2 text-sm">
          {(tasks ?? []).map((task) => (
            <li key={task.id}>{task.title} · {task.status} · {formatDateTime(task.due_at)}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
