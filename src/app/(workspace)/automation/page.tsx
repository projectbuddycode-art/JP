import { saveWorkflowAction, testWorkflowAction, toggleWorkflowAction } from "@/app/actions/crm";
import { testN8nAction, toggleN8nWorkflowAction } from "@/app/actions/n8n";
import { Badge, Button, Card, Input, Label, PageHeader, Textarea } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { ACTION_TYPES, TRIGGER_TYPES } from "@/lib/automation/schema";
import { formatDateTime } from "@/lib/utils";
import { listN8nWorkflows, n8nConfig, testN8nConnection } from "@/lib/n8n/client";
import { profileRole } from "@/lib/auth/permissions";

export const instant = false;

const DEFAULT_DEFINITION = {
  trigger: { type: "lead_created", params: {} },
  conditions: [],
  actions: [
    { id: "task-1", type: "create_task", params: { title: "First contact" }, requiresApproval: false },
    { id: "notify-1", type: "notify_owner", params: { title: "New enquiry" }, requiresApproval: false },
  ],
  timezone: "Asia/Kolkata",
  businessHoursOnly: false,
  maxAttempts: 3,
};

export default async function AutomationPage() {
  const { supabase, profile } = await requireActiveProfile();
  const { data: workflows } = await supabase.from("automation_workflows").select("*").order("created_at", { ascending: false });
  const { data: executions } = await supabase
    .from("automation_executions")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(20);
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, type, status, run_at, last_error")
    .order("run_at", { ascending: false })
    .limit(20);
  const owner = profileRole(profile) === "owner";
  const n8n = n8nConfig();
  const n8nStatus = n8n.configured ? await testN8nConnection() : { ok: false, error: "Not configured" };
  const remote = n8nStatus.ok ? await listN8nWorkflows() : { workflows: [] as unknown[], error: n8nStatus.error };

  return (
    <div>
      <PageHeader
        title="Automation Center"
        description="Configure, pause, test, and inspect workflows inside the CRM. n8n is optional and never required for daily control."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Card><p className="text-sm text-muted">Active</p><p className="font-serif text-3xl">{(workflows ?? []).filter((item) => item.enabled).length}</p></Card>
        <Card><p className="text-sm text-muted">Paused</p><p className="font-serif text-3xl">{(workflows ?? []).filter((item) => !item.enabled).length}</p></Card>
        <Card><p className="text-sm text-muted">Recent failures</p><p className="font-serif text-3xl">{(executions ?? []).filter((item) => item.status === "failed").length}</p></Card>
        <Card><p className="text-sm text-muted">Pending jobs</p><p className="font-serif text-3xl">{(jobs ?? []).filter((item) => item.status === "pending").length}</p></Card>
      </div>
      <Card className="mt-6">
        <h2 className="font-serif text-xl">n8n connection</h2>
        <p className="mt-2 text-sm text-muted">
          Credentials stay on the server. Status: {n8nStatus.ok ? "connected" : n8nStatus.error}. The n8n editor is not embedded.
        </p>
        {owner ? (
          <form action={testN8nAction} className="mt-3">
            <Button variant="secondary" type="submit">Test n8n API</Button>
          </form>
        ) : null}
        {(remote.workflows as Array<{ id?: string; name?: string; active?: boolean }>).length ? (
          <ul className="mt-4 space-y-2 text-sm">
            {(remote.workflows as Array<{ id: string; name?: string; active?: boolean }>).map((workflow) => (
              <li key={workflow.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2">
                <span>{workflow.name} · {workflow.active ? "active" : "paused"}</span>
                {owner ? (
                  <form action={toggleN8nWorkflowAction.bind(null, workflow.id, !workflow.active)}>
                    <Button variant="ghost" type="submit">{workflow.active ? "Pause" : "Enable"}</Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">No remote n8n workflows loaded. Set N8N_BASE_URL and N8N_API_KEY to connect.</p>
        )}
      </Card>
      <Card className="mt-6">
        <h2 className="font-serif text-xl">Suggested travel workflows</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>Website enquiry → unified ingest → assign → follow-up → notify.</li>
          <li>Meta lead → retrieve fields → ingest → assign → notify.</li>
          <li>Instagram enquiry → contact resolve → lead if warranted → notify.</li>
          <li>WhatsApp enquiry → save message → lead if warranted → assign.</li>
          <li>Google Ads lead → validate key → ingest → attribute campaign.</li>
          <li>LinkedIn lead → map fields → ingest (blocked until Lead Sync approval).</li>
          <li>TikTok lead → validate → ingest (blocked without app credentials).</li>
          <li>No first response within SLA → alert assigned partner.</li>
          <li>Proposal sent → follow-up task.</li>
          <li>Booking confirmed → traveller records.</li>
          <li>Booking confirmed → payment schedule task.</li>
          <li>Payment due → staff reminder.</li>
          <li>Departure approaching → operations notification.</li>
          <li>Missing documents → reminder.</li>
          <li>Hotel not confirmed → alert.</li>
          <li>Vehicle not assigned → alert.</li>
          <li>Trip completed → expense reconciliation.</li>
          <li>Trip completed → feedback request where consent exists.</li>
          <li>Daily management report.</li>
          <li>Weekly partner report.</li>
          <li>Scheduled social post → authorized Graph publish.</li>
          <li>Publishing failure → notify owner.</li>
        </ol>
        <p className="mt-3 text-xs text-muted">CRM workflows run locally even if n8n is down. n8n only receives events when N8N_INGEST_WEBHOOK_URL is set.</p>
      </Card>
      {owner ? (
        <Card className="mt-6">
          <h2 className="font-serif text-xl">Guided workflow editor</h2>
          <p className="text-sm text-muted">Triggers: {TRIGGER_TYPES.join(", ")}</p>
          <p className="mt-1 text-sm text-muted">Actions: {ACTION_TYPES.join(", ")}</p>
          <form action={saveWorkflowAction} className="mt-4 space-y-3">
            <Input name="name" placeholder="Workflow name" required />
            <Input name="description" placeholder="Description" />
            <Label>Definition JSON</Label>
            <Textarea name="definition" rows={12} defaultValue={JSON.stringify(DEFAULT_DEFINITION, null, 2)} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" /> Enable immediately</label>
            <Button type="submit">Save workflow</Button>
          </form>
        </Card>
      ) : (
        <p className="mt-6 text-sm text-muted">Only the owner can create or enable workflows.</p>
      )}
      <div className="mt-6 space-y-3">
        {(workflows ?? []).map((workflow) => (
          <Card key={workflow.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">{workflow.name}</h3>
                <p className="text-sm text-muted">{workflow.description}</p>
              </div>
              <Badge tone={workflow.enabled ? "success" : "default"}>{workflow.enabled ? "active" : "paused"}</Badge>
            </div>
            {owner ? (
              <div className="mt-3 flex gap-2">
                <form action={toggleWorkflowAction.bind(null, workflow.id, !workflow.enabled)}>
                  <Button variant="secondary" type="submit">{workflow.enabled ? "Pause" : "Enable"}</Button>
                </form>
                <form action={testWorkflowAction.bind(null, workflow.id)}>
                  <Button variant="ghost" type="submit">Run test</Button>
                </form>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <h2 className="font-serif text-xl">Execution history</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(executions ?? []).map((item) => (
            <li key={item.id} className="rounded-md border border-line p-3">
              {item.trigger_type} · {item.status} {item.dry_run ? "(dry run)" : ""} · {formatDateTime(item.started_at)}
              {item.error ? <span className="text-danger"> · {item.error}</span> : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
