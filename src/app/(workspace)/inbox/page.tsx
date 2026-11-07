import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utils";

export const instant = false;

export default async function InboxPage() {
  const { supabase } = await requireActiveProfile();
  const { data: connection } = await supabase
    .from("integration_connections")
    .select("status, last_error, last_success_at")
    .eq("provider", "whatsapp")
    .maybeSingle();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("*, contact:contacts(full_name, phone_e164, consent_marketing)")
    .order("last_message_at", { ascending: false });
  const ids = (conversations ?? []).map((item) => item.id);
  const { data: messages } = ids.length
    ? await supabase.from("messages").select("*").in("conversation_id", ids).order("created_at", { ascending: false }).limit(200)
    : { data: [] };
  const connected = connection?.status === "connected";

  return (
    <div>
      <PageHeader
        title="WhatsApp inbox"
        description="Official Cloud API workspace. Internal notes stay in the CRM and are never sent to customers."
      />
      {!connected ? (
        <div className="mb-4 rounded-md border border-warm/40 bg-amber-50 px-4 py-3 text-sm">
          WhatsApp is not connected. Open Integrations to add a Cloud API token and phone number id. Eligibility of an existing business number is not guaranteed for every connection mode.
        </div>
      ) : (
        <p className="mb-4 text-sm text-muted">Last successful event: {formatDateTime(connection?.last_success_at)}</p>
      )}
      {!conversations?.length ? (
        <EmptyState title="No conversations" body="Inbound webhooks will appear here after WhatsApp is connected and verified." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Card key={conversation.id}>
                <p className="font-medium">{conversation.contact?.full_name ?? conversation.contact?.phone_e164}</p>
                <p className="text-xs text-muted">{formatDateTime(conversation.last_message_at)}</p>
                {conversation.unread_count > 0 ? <Badge tone="warn">{conversation.unread_count} unread</Badge> : null}
                {conversation.human_takeover ? <Badge>Human takeover</Badge> : null}
                {!conversation.contact?.consent_marketing ? <p className="mt-1 text-xs">Marketing suppressed or not opted in</p> : null}
              </Card>
            ))}
          </div>
          <Card className="lg:col-span-2">
            <h2 className="font-serif text-xl">Recent messages</h2>
            <div className="mt-4 space-y-3">
              {(messages ?? []).map((message) => (
                <div key={message.id} className="rounded-md border border-line p-3 text-sm">
                  <div className="flex justify-between">
                    <Badge tone={message.direction === "internal" ? "warn" : "default"}>{message.direction}</Badge>
                    <span>{message.status}</span>
                  </div>
                  <p className="mt-2">{message.body}</p>
                  {message.direction === "internal" ? (
                    <p className="text-xs text-muted">Internal note — not sent to the customer</p>
                  ) : null}
                  {message.error_detail ? <p className="text-xs text-danger">{message.error_detail}</p> : null}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
