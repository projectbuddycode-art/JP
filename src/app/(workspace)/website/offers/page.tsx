import { saveOfferAction } from "@/app/actions/website";
import { Button, Card, Input, Label, PageHeader, Textarea } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";

export const instant = false;

export default async function WebsiteOffersPage() {
  const { supabase } = await requirePermission("content.publish");
  const { data: rows } = await supabase.from("website_offers").select("*").order("created_at", { ascending: false });
  return (
    <div>
      <PageHeader title="Promotional offers" description="Only published offers appear on the public website. Leave this empty rather than inventing discounts." />
      <Card>
        <form action={saveOfferAction} className="space-y-3">
          <div><Label>Offer title</Label><Input name="title" required /></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Discount label</Label><Input name="discount_label" placeholder="10% off confirmed groups" /></div>
            <div><Label>Coupon code</Label><Input name="coupon_code" /></div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Valid until</Label><Input name="valid_until" type="date" /></div>
            <div>
              <Label>Status</Label>
              <select name="status" className="rounded-md border border-line px-3 py-2 text-sm">
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </div>
          </div>
          <div><Label>Applicable trips</Label><Textarea name="applicable_trips" rows={2} /></div>
          <div><Label>Banner image URL</Label><Input name="banner_image_url" /></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>CTA label</Label><Input name="cta_label" defaultValue="View trips" /></div>
            <div><Label>CTA link</Label><Input name="cta_href" defaultValue="/trips" /></div>
          </div>
          <Button type="submit">Save offer</Button>
        </form>
      </Card>
      <Card className="mt-6">
        <h2 className="font-serif text-xl">Existing offers</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(rows ?? []).length ? (rows ?? []).map((item) => (
            <li key={item.id}>{item.title} · {item.status} · {item.coupon_code || "no code"} · until {item.valid_until || "open"}</li>
          )) : <li className="text-muted">No offers yet.</li>}
        </ul>
      </Card>
    </div>
  );
}
