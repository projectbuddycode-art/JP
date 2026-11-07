import Link from "next/link";
import { publishPackageWebsiteAction } from "@/app/actions/website";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { formatIst } from "@/lib/reports/timezone";
import { publicEnv } from "@/lib/public-env";

export const instant = false;

export default async function WebsiteHubPage() {
  const { supabase } = await requirePermission("content.publish");
  const [{ data: packages }, { data: leads }, { data: events }, { data: articles }, { data: audit }] = await Promise.all([
    supabase.from("packages").select("id, name, slug, destination, status, website_status, published_at"),
    supabase.from("leads").select("id, full_name, destination, source, created_at, owner_id").in("source", ["website", "website_form"]).order("created_at", { ascending: false }).limit(20),
    supabase.from("website_events").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("website_articles").select("id, title, status, slug"),
    supabase.from("audit_logs").select("*").in("action", ["trip_published", "trip_unpublished", "website_page_updated", "lead_created"]).order("created_at", { ascending: false }).limit(20),
  ]);
  const origin = publicEnv().appUrl;
  const counts = {
    published: (packages ?? []).filter((item) => item.website_status === "published" || item.status === "published").length,
    draft: (packages ?? []).filter((item) => (item.website_status || "draft") === "draft").length,
    unpublished: (packages ?? []).filter((item) => item.website_status === "unpublished").length,
  };
  return (
    <div>
      <PageHeader
        title="Website"
        description={`Public site and CRM share packages, enquiries, and publishing. Domain: ${origin}`}
        actions={<Link className="text-sm text-accent" href="/" target="_blank">Open public site</Link>}
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Card><p className="text-sm text-muted">Published trips</p><p className="font-serif text-3xl">{counts.published}</p></Card>
        <Card><p className="text-sm text-muted">Drafts</p><p className="font-serif text-3xl">{counts.draft}</p></Card>
        <Card><p className="text-sm text-muted">Website enquiries</p><p className="font-serif text-3xl">{(leads ?? []).length}</p></Card>
        <Card><p className="text-sm text-muted">Guides</p><p className="font-serif text-3xl">{(articles ?? []).length}</p></Card>
      </div>
      <div className="mt-6 flex gap-3 text-sm">
        <Link className="rounded-md border border-line px-3 py-2" href="/website/content">Content</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/website/enquiries">Enquiries</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/website/analytics">Analytics</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/website/seo">SEO</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/packages">Trip publishing</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/social">Social calendar</Link>
        <Link className="rounded-md border border-line px-3 py-2" href="/campaigns">Attribution</Link>
      </div>
      <Card className="mt-6">
        <h2 className="font-serif text-xl">Publish a trip</h2>
        {(packages ?? []).map((pack) => (
          <form key={pack.id} action={publishPackageWebsiteAction} className="mt-4 grid gap-2 border-t border-line py-3 md:grid-cols-5">
            <input type="hidden" name="id" value={pack.id} />
            <p className="md:col-span-2">{pack.name}<span className="block text-xs text-muted">{origin}/trips/{pack.slug}</span></p>
            <select name="website_status" defaultValue={pack.website_status || "draft"} className="rounded-md border border-line px-2 py-1 text-sm">
              <option value="draft">draft</option>
              <option value="pending_approval">pending approval</option>
              <option value="published">published</option>
              <option value="scheduled">scheduled</option>
              <option value="unpublished">unpublished</option>
              <option value="archived">archived</option>
            </select>
            <Input name="cover_image_url" placeholder="Cover image URL" />
            <div className="flex gap-2">
              <Button type="submit">Save listing</Button>
              <Link className="self-center text-xs text-accent" href={`/trips/${pack.slug}?preview=1`} target="_blank">Preview</Link>
            </div>
          </form>
        ))}
      </Card>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-xl">Website enquiries</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(leads ?? []).map((lead) => (
              <li key={lead.id}>
                <Link href={`/leads/${lead.id}`}>{lead.full_name}</Link> · {lead.destination} · {formatIst(lead.created_at)}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Publishing activity</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(audit ?? []).map((event) => (
              <li key={event.id}>
                {formatIst(event.created_at)} · {event.action} · {event.entity_name || event.entity_id}
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card className="mt-6">
        <h2 className="font-serif text-xl">First-party events</h2>
        <p className="mt-2 text-sm text-muted">GA4/Meta totals appear only when those IDs are configured. These rows are CRM-recorded events, not invented traffic.</p>
        <ul className="mt-3 space-y-1 text-sm">
          {(events ?? []).length ? (events ?? []).map((event) => (
            <li key={event.id}>{event.event_name} · {event.path} · {formatIst(event.created_at)}</li>
          )) : <li className="text-muted">No first-party website events yet.</li>}
        </ul>
        <p className="mt-3 text-xs text-muted">Unpublished: {counts.unpublished}</p>
      </Card>
    </div>
  );
}
