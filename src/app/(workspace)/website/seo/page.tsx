import { Card, PageHeader } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { publicEnv } from "@/lib/public-env";

export const instant = false;

export default async function WebsiteSeoPage() {
  await requirePermission("content.publish");
  const origin = publicEnv().appUrl;
  return (
    <div>
      <PageHeader title="Website SEO" description="Technical search setup. Analytics IDs stay empty until you configure them." />
      <Card>
        <dl className="space-y-2 text-sm">
          <div><dt className="text-muted">Canonical host</dt><dd>{origin}</dd></div>
          <div><dt className="text-muted">Sitemap</dt><dd>{origin}/sitemap.xml</dd></div>
          <div><dt className="text-muted">Robots</dt><dd>{origin}/robots.txt</dd></div>
          <div><dt className="text-muted">Public trips API</dt><dd>{origin}/api/public/trips</dd></div>
          <div><dt className="text-muted">GA4</dt><dd>{process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || "Not configured — no visitor counts are shown."}</dd></div>
          <div><dt className="text-muted">Meta Pixel</dt><dd>{process.env.NEXT_PUBLIC_META_PIXEL_ID || "Not configured."}</dd></div>
        </dl>
      </Card>
    </div>
  );
}
