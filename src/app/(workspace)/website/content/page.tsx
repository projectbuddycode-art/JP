import { saveArticleAction, saveDestinationAction, saveWebsitePageAction } from "@/app/actions/website";
import { Button, Card, Input, Label, PageHeader, Textarea } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { DEFAULT_HOME } from "@/lib/site/defaults";

export const instant = false;

export default async function WebsiteContentPage() {
  const { supabase } = await requirePermission("content.publish");
  const { data: home } = await supabase.from("website_pages").select("*").eq("page_key", "home").maybeSingle();
  const content = { ...DEFAULT_HOME, ...((home?.content ?? {}) as Record<string, string>) };
  const { data: articles } = await supabase.from("website_articles").select("*").order("updated_at", { ascending: false });
  const { data: destinations } = await supabase.from("website_destinations").select("*").order("name");
  return (
    <div>
      <PageHeader title="Website content" description="Edit public copy without changing source code. Partners cannot publish brand pages." />
      <Card>
        <h2 className="font-serif text-xl">Homepage</h2>
        <form action={saveWebsitePageAction} className="mt-4 space-y-3">
          <input type="hidden" name="page_key" value="home" />
          <div><Label>Hero heading</Label><Input name="heroHeading" defaultValue={content.heroHeading} /></div>
          <div><Label>Hero subheading</Label><Textarea name="heroSubheading" defaultValue={content.heroSubheading} rows={3} /></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Primary CTA</Label><Input name="ctaPrimary" defaultValue={content.ctaPrimary} /></div>
            <div><Label>Secondary CTA</Label><Input name="ctaSecondary" defaultValue={content.ctaSecondary} /></div>
          </div>
          <div><Label>SEO title</Label><Input name="seo_title" defaultValue={home?.seo_title ?? ""} /></div>
          <div><Label>SEO description</Label><Textarea name="seo_description" defaultValue={home?.seo_description ?? ""} rows={2} /></div>
          <Button type="submit">Publish homepage copy</Button>
        </form>
      </Card>
      <Card className="mt-6">
        <h2 className="font-serif text-xl">Destination page</h2>
        <form action={saveDestinationAction} className="mt-4 space-y-3">
          <Input name="name" placeholder="Name" required />
          <Input name="slug" placeholder="spiti-valley" required />
          <Textarea name="summary" placeholder="Short editorial summary" rows={2} />
          <Textarea name="overview" placeholder="Overview. Do not invent permits or road status." rows={4} />
          <Input name="best_season" placeholder="Verified season notes only" />
          <Input name="hero_image_url" placeholder="Hero image URL" />
          <select name="status" className="rounded-md border border-line px-3 py-2 text-sm">
            <option value="published">published</option>
            <option value="draft">draft</option>
          </select>
          <Button type="submit">Save destination</Button>
        </form>
        <ul className="mt-3 text-sm">
          {(destinations ?? []).map((item) => (
            <li key={item.id}>{item.name} · /destinations/{item.slug} · {item.status}</li>
          ))}
        </ul>
      </Card>
      <Card className="mt-6">
        <h2 className="font-serif text-xl">New travel guide</h2>
        <form action={saveArticleAction} className="mt-4 space-y-3">
          <Input name="title" placeholder="Title" required />
          <Input name="slug" placeholder="slug" />
          <Input name="category" placeholder="Category" />
          <Input name="destination_slug" placeholder="spiti-valley / manali / ladakh" />
          <Textarea name="excerpt" placeholder="Excerpt" rows={2} />
          <Textarea name="body" placeholder="Article body. Do not invent permits, weather, or prices." rows={8} />
          <select name="status" className="rounded-md border border-line px-3 py-2 text-sm">
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
          <Button type="submit">Save article</Button>
        </form>
        <ul className="mt-4 space-y-2 text-sm">
          {(articles ?? []).map((article) => (
            <li key={article.id}>{article.title} · {article.status} · /travel-guides/{article.slug}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
