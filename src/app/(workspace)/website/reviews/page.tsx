import { moderateTestimonialAction } from "@/app/actions/website";
import { Button, Card, PageHeader } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";

export const instant = false;

export default async function WebsiteReviewsPage() {
  const { supabase } = await requirePermission("content.publish");
  const { data: rows } = await supabase.from("website_testimonials").select("*").order("created_at", { ascending: false });
  return (
    <div>
      <PageHeader title="Review moderation" description="Public reviews appear only when status is published and permission is recorded. Do not invent testimonials." />
      <Card>
        {(rows ?? []).length ? (rows ?? []).map((item) => (
          <form key={item.id} action={moderateTestimonialAction} className="mt-4 space-y-2 border-t border-line py-4">
            <input type="hidden" name="id" value={item.id} />
            <p className="font-medium">{item.traveller_name || item.attribution || "Unnamed"} · {item.trip_name || "No trip named"} · {item.status}</p>
            <p className="text-sm text-muted">{item.quote}</p>
            <p className="text-xs text-muted">Permission recorded: {String(item.permission_recorded)} · Rating: {item.rating ?? "none"}</p>
            <div className="flex flex-wrap items-center gap-3">
              <select name="status" defaultValue={item.status} className="rounded-md border border-line px-2 py-1 text-sm">
                <option value="pending">pending</option>
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="rejected">rejected</option>
              </select>
              <label className="text-sm">
                <input type="checkbox" name="featured" defaultChecked={Boolean(item.featured)} className="mr-1" />
                Featured
              </label>
              <Button type="submit">Save</Button>
            </div>
          </form>
        )) : <p className="text-sm text-muted">No review submissions yet.</p>}
      </Card>
    </div>
  );
}
