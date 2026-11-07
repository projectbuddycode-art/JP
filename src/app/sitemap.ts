import type { MetadataRoute } from "next";
import { listPublishedArticles, listPublishedDestinations, listPublishedPackages } from "@/lib/site/catalog";
import { siteUrl } from "@/lib/site/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [packages, destinations, articles] = await Promise.all([
    listPublishedPackages(),
    listPublishedDestinations(),
    listPublishedArticles(),
  ]);
  const staticRoutes = [
    "",
    "/destinations",
    "/trips",
    "/custom-trip",
    "/about",
    "/travel-guides",
    "/contact",
    "/enquire",
    "/privacy-policy",
    "/terms-and-conditions",
    "/cancellation-policy",
  ].map((path) => ({
    url: siteUrl(path || "/"),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
  return [
    ...staticRoutes,
    ...packages.map((item) => ({ url: siteUrl(`/trips/${item.slug}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...destinations.map((item) => ({ url: siteUrl(`/destinations/${item.slug}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...articles.map((item) => ({ url: siteUrl(`/travel-guides/${item.slug}`), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
