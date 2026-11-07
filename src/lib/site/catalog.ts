import { tryCreateAdminClient } from "@/lib/supabase/admin";
import type { PublicPackage } from "@/lib/site/types";
import { isPubliclyListed } from "@/lib/site/visibility";

export const PUBLIC_PACKAGE_COLUMNS =
  "id, name, slug, destination, region, short_description, long_description, duration_days, itinerary, best_season, departure_points, group_size, price_per_person, currency, inclusions, exclusions, accommodation, transport, difficulty, faqs, cancellation_policy, status, website_status, cover_image_url, video_url, trip_type, highlights, price_visibility, seo_title, seo_description, og_image_url, published_at";

export type { PublicPackage };
export { isPubliclyListed, publicPackageDto } from "@/lib/site/visibility";

async function client() {
  return tryCreateAdminClient();
}

export async function listPublishedPackages(destination?: string) {
  const admin = await client();
  if (!admin) return [];
  const { data } = await admin.from("packages").select(PUBLIC_PACKAGE_COLUMNS).limit(200);
  return ((data ?? []) as PublicPackage[])
    .filter(isPubliclyListed)
    .filter((item) => (destination ? item.destination.toLowerCase().includes(destination.toLowerCase()) : true));
}

export async function getPublishedPackage(slug: string) {
  const admin = await client();
  if (!admin) return null;
  const { data } = await admin.from("packages").select(PUBLIC_PACKAGE_COLUMNS).eq("slug", slug).maybeSingle();
  const pack = data as PublicPackage | null;
  if (!pack || !isPubliclyListed(pack)) return null;
  return pack;
}

export async function getPackageBySlug(slug: string) {
  const admin = await client();
  if (!admin) return null;
  const { data } = await admin.from("packages").select(PUBLIC_PACKAGE_COLUMNS).eq("slug", slug).maybeSingle();
  return (data as PublicPackage | null) ?? null;
}

export async function listPublishedDestinations() {
  const admin = await client();
  if (!admin) return [];
  const { data } = await admin.from("website_destinations").select("*").eq("status", "published").limit(50);
  return data ?? [];
}

export async function getPublishedDestination(slug: string) {
  const admin = await client();
  if (!admin) return null;
  const { data } = await admin.from("website_destinations").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  return data;
}

export async function listPublishedArticles(destinationSlug?: string) {
  const admin = await client();
  if (!admin) return [];
  const { data } = await admin.from("website_articles").select("*").eq("status", "published").limit(50);
  const rows = data ?? [];
  return destinationSlug ? rows.filter((item) => item.destination_slug === destinationSlug) : rows;
}

export async function getPublishedArticle(slug: string) {
  const admin = await client();
  if (!admin) return null;
  const { data } = await admin.from("website_articles").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  return data;
}

export async function listApprovedTestimonials() {
  const admin = await client();
  if (!admin) return [];
  const { data } = await admin
    .from("website_testimonials")
    .select("*")
    .eq("status", "published")
    .eq("permission_recorded", true)
    .limit(20);
  return data ?? [];
}

export async function getWebsitePage(key: string) {
  const admin = await client();
  if (!admin) return null;
  const { data } = await admin.from("website_pages").select("*").eq("page_key", key).maybeSingle();
  return data;
}
