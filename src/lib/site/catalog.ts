import { connection } from "next/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import type { PublicDeparture, PublicOffer, PublicPackage, PublicTestimonial } from "@/lib/site/types";
import { isPubliclyListed } from "@/lib/site/visibility";

export const PUBLIC_PACKAGE_COLUMNS =
  "id, name, slug, destination, region, short_description, long_description, duration_days, itinerary, best_season, departure_points, group_size, price_per_person, currency, inclusions, exclusions, accommodation, transport, difficulty, faqs, cancellation_policy, status, website_status, cover_image_url, video_url, trip_type, highlights, price_visibility, seo_title, seo_description, og_image_url, published_at";

export type { PublicDeparture, PublicOffer, PublicPackage, PublicTestimonial };
export { isPubliclyListed, publicPackageDto } from "@/lib/site/visibility";

const PUBLIC_DEPARTURE_STATUSES = ["open", "filling", "full", "confirmed"];

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

export async function listApprovedTestimonials(packageId?: string) {
  const admin = await client();
  if (!admin) return [] as PublicTestimonial[];
  const { data } = await admin
    .from("website_testimonials")
    .select("*")
    .eq("status", "published")
    .eq("permission_recorded", true)
    .limit(40);
  const rows = (data ?? []) as PublicTestimonial[];
  return packageId ? rows.filter((item) => item.package_id === packageId) : rows;
}

export async function getWebsitePage(key: string) {
  const admin = await client();
  if (!admin) return null;
  const { data } = await admin.from("website_pages").select("*").eq("page_key", key).maybeSingle();
  return data;
}

export async function listPublishedOffers() {
  await connection();
  const admin = await client();
  if (!admin) return [] as PublicOffer[];
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await admin.from("website_offers").select("*").eq("status", "published").limit(12);
  if (error) return [];
  return ((data ?? []) as PublicOffer[]).filter((offer) => !offer.valid_until || offer.valid_until >= today);
}

export async function listPublicDepartures() {
  await connection();
  const admin = await client();
  if (!admin) return [] as PublicDeparture[];
  const today = new Date().toISOString().slice(0, 10);
  const { data: rows } = await admin
    .from("departures")
    .select("id, name, package_id, destination, start_date, end_date, capacity, status, start_location")
    .gte("start_date", today)
    .limit(100);
  const departures = ((rows ?? []) as PublicDeparture[]).filter((item) => PUBLIC_DEPARTURE_STATUSES.includes(item.status));
  if (!departures.length) return [];
  const packages = await listPublishedPackages();
  const byId = new Map(packages.map((pack) => [pack.id, pack]));
  const { data: travellers } = await admin.from("departure_travellers").select("departure_id");
  const counts = new Map<string, number>();
  for (const row of travellers ?? []) {
    const id = (row as { departure_id?: string }).departure_id;
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return departures
    .map((item) => {
      const pack = item.package_id ? byId.get(item.package_id) ?? null : null;
      if (item.package_id && !pack) return null;
      const booked = counts.get(item.id) ?? 0;
      const seats =
        typeof item.capacity === "number" && item.capacity > 0 ? Math.max(item.capacity - booked, 0) : null;
      const duration =
        pack?.duration_days ||
        (item.start_date && item.end_date
          ? Math.max(
              1,
              Math.round(
                (new Date(item.end_date).getTime() - new Date(item.start_date).getTime()) / 86_400_000,
              ) + 1,
            )
          : null);
      return {
        ...item,
        package: pack,
        seats_remaining: seats,
        duration_days: duration,
      } as PublicDeparture;
    })
    .filter(Boolean) as PublicDeparture[];
}

export function readingMinutes(text?: string | null) {
  const words = (text ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}
