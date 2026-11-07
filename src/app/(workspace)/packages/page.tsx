import Link from "next/link";
import { clonePackageAction, savePackageAction } from "@/app/actions/crm";
import { Badge, Button, Card, EmptyState, Input, Label, PageHeader, Textarea } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/utils";
import { publicEnv } from "@/lib/public-env";

export const instant = false;

export default async function PackagesPage() {
  const { supabase } = await requireActiveProfile();
  const { data: packages } = await supabase.from("packages").select("*").order("name");
  const origin = publicEnv().appUrl;
  return (
    <div>
      <PageHeader
        title="Travel packages"
        description="Catalogue for Spiti, Manali, Ladakh, and additional destinations. Live availability is never invented."
      />
      <Card className="mb-6">
        <h2 className="font-serif text-xl">Create or update</h2>
        <form action={savePackageAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <div><Label>Name</Label><Input name="name" required /></div>
          <div><Label>Slug</Label><Input name="slug" placeholder="auto from name if empty" /></div>
          <div><Label>Destination</Label><Input name="destination" required /></div>
          <div><Label>Region</Label><Input name="region" /></div>
          <div><Label>Duration (days)</Label><Input name="duration_days" type="number" /></div>
          <div><Label>Price per person</Label><Input name="price_per_person" type="number" /></div>
          <div className="md:col-span-2"><Label>Short description</Label><Textarea name="short_description" rows={2} /></div>
          <div><Label>Inclusions</Label><Textarea name="inclusions" rows={2} /></div>
          <div><Label>Exclusions</Label><Textarea name="exclusions" rows={2} /></div>
          <div>
            <Label>Status</Label>
            <select name="status" className="w-full rounded-md border border-line px-3 py-2 text-sm">
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </div>
          <div className="flex items-end"><Button type="submit">Save package</Button></div>
        </form>
      </Card>
      {!packages?.length ? (
        <EmptyState title="No packages" body="Add a Spiti, Ladakh, or Manali itinerary to start sharing proposals." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {packages.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-2xl">{item.name}</h3>
                  <p className="text-sm text-muted">{item.destination} · {item.duration_days ?? "?"} days</p>
                </div>
                <Badge>{item.status}</Badge>
              </div>
              <p className="mt-3 text-sm">{item.short_description}</p>
              <p className="mt-2 text-sm">{formatCurrency(item.price_per_person, item.currency)} / person</p>
              {item.status === "published" ? (
                <p className="mt-2 text-xs text-muted">Public URL: {origin}/trips/{item.slug}</p>
              ) : null}
              <form action={clonePackageAction.bind(null, item.id)} className="mt-4">
                <Button variant="secondary" type="submit">Clone</Button>
              </form>
              <Link href={`/p/${item.slug}`} className="ml-3 text-sm text-accent">Preview</Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
