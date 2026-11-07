import { notFound } from "next/navigation";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";

export const instant = false;

export default async function PublicProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = tryCreateAdminClient();
  if (!admin) notFound();
  const { data: proposal } = await admin
    .from("proposals")
    .select("id, title, body_markdown, amount, currency, status, expires_at, package_id")
    .eq("public_token", token)
    .maybeSingle();
  if (!proposal) notFound();
  if (proposal.expires_at && new Date(proposal.expires_at) < new Date() && proposal.status !== "accepted") {
    await admin.from("proposals").update({ status: "expired" }).eq("id", proposal.id);
  }
  if (["sent"].includes(proposal.status)) {
    await admin
      .from("proposals")
      .update({ status: "viewed", viewed_at: new Date().toISOString() })
      .eq("id", proposal.id);
  }
  const { data: pack } = proposal.package_id
    ? await admin.from("packages").select("name, destination, short_description").eq("id", proposal.package_id).maybeSingle()
    : { data: null };

  return (
    <article className="mx-auto max-w-2xl px-4 py-16">
      <p className="text-sm text-muted">Private proposal · Northridge</p>
      <h1 className="mt-2 font-serif text-4xl">{proposal.title}</h1>
      {pack ? <p className="mt-2 text-muted">{pack.name} · {pack.destination}</p> : null}
      <p className="mt-4 text-lg">{formatCurrency(proposal.amount, proposal.currency)}</p>
      <div className="mt-6 whitespace-pre-wrap text-sm">{proposal.body_markdown}</div>
      <p className="mt-8 text-xs text-muted">
        CRM notes and other customer records are never included on this page. Accepting is recorded in the CRM by the travel desk after you reply.
      </p>
    </article>
  );
}
