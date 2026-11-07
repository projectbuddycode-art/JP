import Link from "next/link";
import { disconnectIntegrationAction, saveIntegrationSecretAction, testIntegrationAction } from "@/app/actions/integrations";
import { Button, Card, Input, Label, PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { publicEnv } from "@/lib/public-env";
import { formatDateTime } from "@/lib/utils";
import { PROVIDER_CATALOG, displayConnectionStatus } from "@/lib/integrations/catalog";
import { n8nConfig, testN8nConnection } from "@/lib/n8n/client";
import { profileRole } from "@/lib/auth/permissions";

export const instant = false;

export default async function IntegrationsPage() {
  const { supabase, profile } = await requireActiveProfile();
  const { data: connections } = await supabase.from("integration_connections").select("*");
  const { data: events } = await supabase
    .from("integration_events")
    .select("provider, event_type, status, outcome, received_at, error_detail, lead_id")
    .order("received_at", { ascending: false })
    .limit(15);
  const origin = publicEnv().appUrl;
  const owner = profileRole(profile) === "owner";
  const byProvider = new Map((connections ?? []).map((item) => [item.provider, item]));
  const n8n = n8nConfig();
  const n8nLive = n8n.configured ? await testN8nConnection() : { ok: false, error: "Not configured" };

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connection state is verified, never assumed. Tokens never render here. Every channel writes into the same lead inbox."
        actions={<Link className="rounded-md border border-line px-3 py-2 text-sm" href="/integrations/delivery">Delivery monitor</Link>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {PROVIDER_CATALOG.map((doc) => {
          const connection = byProvider.get(doc.id);
          const n8nOverride = doc.id === "n8n" ? (n8nLive.ok ? "connected" : "not_configured") : null;
          const status = displayConnectionStatus({
            provider: doc.id,
            status: n8nOverride ?? connection?.status ?? "not_configured",
            last_error: connection?.last_error,
            authorization_status: connection?.authorization_status,
            last_success_at: connection?.last_success_at,
          });
          return (
            <Card key={doc.id}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-serif text-2xl">{doc.title}</h2>
                <span className="text-sm">{status}</span>
              </div>
              <p className="mt-2 text-sm">{doc.captures}</p>
              <p className="mt-1 text-sm text-muted">Cannot capture: {doc.cannotCapture}</p>
              <p className="mt-2 text-sm text-muted">Last success: {formatDateTime(connection?.last_success_at)} · Last lead: {formatDateTime(connection?.last_lead_at)}</p>
              {connection?.last_error ? <p className="text-sm text-danger">{connection.last_error}</p> : null}
              {doc.webhookPath ? (
                <p className="mt-2 text-xs break-all">Webhook: {origin}{doc.webhookPath}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link className="text-sm text-accent" href={`/integrations/${doc.id}`}>Setup guide</Link>
                {doc.id === "meta_lead_ads" || doc.id === "meta_social" ? (
                  <a className="text-sm text-accent" href="/api/oauth/meta">Connect Meta</a>
                ) : null}
                {doc.id === "linkedin" ? (
                  <a className="text-sm text-accent" href="/api/oauth/linkedin">Connect LinkedIn</a>
                ) : null}
              </div>
              {owner ? (
                <form action={saveIntegrationSecretAction} className="mt-4 space-y-2">
                  <input type="hidden" name="provider" value={doc.id} />
                  {doc.credentials.length ? (
                    <>
                      <Label>Server credential (never shown again)</Label>
                      <Input name="accessToken" type="password" placeholder="Access token if used" />
                      {doc.id === "whatsapp" ? <Input name="phoneNumberId" placeholder="Phone number id" /> : null}
                      {doc.id === "meta_social" ? (
                        <>
                          <Input name="pageId" placeholder="Page id" />
                          <Input name="igUserId" placeholder="Instagram user id" />
                        </>
                      ) : null}
                      <Input name="webhookKey" type="password" placeholder="Webhook key if used" />
                    </>
                  ) : (
                    <p className="text-xs text-muted">No secret is stored for this channel.</p>
                  )}
                  <div className="flex gap-2">
                    {doc.credentials.length ? <Button type="submit">Save credentials</Button> : null}
                  </div>
                </form>
              ) : (
                <p className="mt-3 text-sm text-muted">Owner-only credential controls.</p>
              )}
              {owner ? (
                <div className="mt-3 flex gap-2">
                  <form action={testIntegrationAction.bind(null, doc.id)}>
                    <Button variant="secondary" type="submit">Test connection</Button>
                  </form>
                  <form action={disconnectIntegrationAction.bind(null, doc.id)}>
                    <Button variant="ghost" type="submit">Disconnect</Button>
                  </form>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
      <Card className="mt-6">
        <h2 className="font-serif text-xl">Recent ingest events</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(events ?? []).map((event, index) => (
            <li key={index} className="rounded-md border border-line p-3">
              {event.provider} · {event.event_type} · {event.outcome || event.status} · {formatDateTime(event.received_at)}
              {event.lead_id ? <Link className="text-accent" href={`/leads/${event.lead_id}`}> · lead</Link> : null}
              {event.error_detail ? <span className="text-danger"> · {event.error_detail}</span> : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
