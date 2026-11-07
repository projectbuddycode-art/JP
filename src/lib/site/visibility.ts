import type { PublicPackage } from "@/lib/site/types";

export function isPubliclyListed(pack: { status?: string | null; website_status?: string | null }) {
  if (pack.website_status) return pack.website_status === "published";
  return pack.status === "published";
}

export function publicPackageDto(pack: PublicPackage) {
  return {
    id: pack.id,
    name: pack.name,
    slug: pack.slug,
    destination: pack.destination,
    region: pack.region ?? null,
    short_description: pack.short_description ?? null,
    long_description: pack.long_description ?? null,
    duration_days: pack.duration_days ?? null,
    itinerary: pack.itinerary ?? [],
    group_size: pack.group_size ?? null,
    price_per_person: pack.price_visibility === "contact" || pack.price_visibility === "request_quote" ? null : pack.price_per_person ?? null,
    currency: pack.currency ?? "INR",
    price_visibility: pack.price_visibility ?? "starting_from",
    inclusions: pack.inclusions ?? null,
    exclusions: pack.exclusions ?? null,
    accommodation: pack.accommodation ?? null,
    transport: pack.transport ?? null,
    difficulty: pack.difficulty ?? null,
    trip_type: pack.trip_type ?? null,
    highlights: Array.isArray(pack.highlights) ? pack.highlights : [],
    cover_image_url: pack.cover_image_url ?? pack.og_image_url ?? null,
    seo_title: pack.seo_title ?? pack.name,
    seo_description: pack.seo_description ?? pack.short_description,
    cancellation_policy: pack.cancellation_policy ?? null,
    faqs: pack.faqs ?? [],
  };
}
