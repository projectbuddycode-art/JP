import { generateCaptionAction, saveSocialPostAction } from "@/app/actions/crm";
import { Badge, Button, Card, Input, Label, PageHeader, Textarea } from "@/components/ui";
import { requireActiveProfile } from "@/lib/auth/session";
import { aiStatus } from "@/lib/ai/provider";
import { formatDateTime } from "@/lib/utils";

export const instant = false;

const THEMES = [
  "Spiti Valley itineraries",
  "Ladakh road trips",
  "Manali weekend escapes",
  "Travel tips and packing lists",
  "Customer testimonials with permission",
  "Destination guides",
  "Seasonal travel campaigns",
  "Frequently asked questions",
  "Package promotions",
  "Behind-the-scenes content",
];

export default async function SocialPage() {
  const { supabase } = await requireActiveProfile();
  const { data: posts } = await supabase
    .from("social_posts")
    .select("*, platforms:social_post_platforms(*)")
    .order("scheduled_for", { ascending: true, nullsFirst: false });
  const { data: connection } = await supabase
    .from("integration_connections")
    .select("status, last_error")
    .eq("provider", "meta_social")
    .maybeSingle();
  const ai = aiStatus();

  return (
    <div>
      <PageHeader
        title="Social Media Studio"
        description="Draft, approve, and schedule content. A post is marked published only after the provider confirms success."
      />
      {connection?.status !== "connected" ? (
        <div className="mb-4 rounded-md border border-warm/40 bg-amber-50 px-4 py-3 text-sm">
          Instagram/Facebook publishing is not connected. You can still compose, save drafts, and schedule jobs. Connect Meta on the Integrations page.
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-xl">Composer</h2>
          <form action={saveSocialPostAction} className="mt-4 space-y-3">
            <div><Label>Title</Label><Input name="title" /></div>
            <div>
              <Label>Theme</Label>
              <select name="theme" className="w-full rounded-md border border-line px-3 py-2 text-sm">
                {THEMES.map((theme) => (
                  <option key={theme}>{theme}</option>
                ))}
              </select>
            </div>
            <div><Label>Destination</Label><Input name="destination" placeholder="Spiti Valley" /></div>
            <div><Label>Caption</Label><Textarea name="caption" rows={6} /></div>
            <div><Label>Hashtags</Label><Input name="hashtags" /></div>
            <div><Label>Call to action</Label><Input name="cta" placeholder="Enquire for 2026 departures" /></div>
            <div>
              <Label>Platforms</Label>
              <Input name="platforms" defaultValue="instagram,facebook" />
            </div>
            <div>
              <Label>Schedule (timezone Asia/Kolkata unless changed)</Label>
              <Input name="scheduled_for" type="datetime-local" />
              <Input name="timezone" defaultValue="Asia/Kolkata" />
            </div>
            <Button type="submit">Save / schedule</Button>
          </form>
          <form action={generateCaptionAction} className="mt-6 space-y-3 border-t border-line pt-4">
            <p className="text-sm text-muted">
              AI caption assist {ai.configured ? `via ${ai.provider}` : "is not configured — composer still works manually"}.
            </p>
            <Input name="destination" placeholder="Destination" />
            <Input name="theme" placeholder="Theme" />
            <Button type="submit" variant="secondary">Generate editable draft</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-serif text-xl">Calendar queue</h2>
          <div className="mt-4 space-y-3">
            {(posts ?? []).map((post) => (
              <div key={post.id} className="rounded-md border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{post.title || post.theme}</p>
                  <Badge
                    tone={
                      post.status === "published"
                        ? "success"
                        : post.status === "failed"
                          ? "danger"
                          : "default"
                    }
                  >
                    {post.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted">{post.destination} · {formatDateTime(post.scheduled_for)}</p>
                <p className="mt-2 line-clamp-3 text-sm">{post.caption}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(post.platforms ?? []).map((platform: { id: string; platform: string; status: string; last_error: string | null }) => (
                    <Badge key={platform.id} tone={platform.status === "failed" ? "danger" : "default"}>
                      {platform.platform}: {platform.status}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
