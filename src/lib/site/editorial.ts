import type { PublicPackage } from "@/lib/site/types";
import { formatFaqs, highlightList } from "@/lib/site/itinerary";
import { galleryForDestination, profileForDestination } from "@/lib/site/media";

export const PROCESS_FAQS = [
  {
    q: "How do I book a Himalayan trip with Northridge?",
    a: "Send an enquiry from a journey page, destination page, or the Plan your trip form. That creates a CRM lead with a follow-up task. A journey is confirmed only after the travel desk records a booking — viewing a page or a Reel does not book dates.",
  },
  {
    q: "Are prices on the website a confirmed quote?",
    a: "Public prices are shown only when the package is set to display them. “From” prices are starting figures. Quote-on-request trips hide the number until the desk replies. Taxes, season supplements and group size can change the final amount.",
  },
  {
    q: "Can Northridge plan a private or custom itinerary?",
    a: "Yes. Use Design your journey, choose Custom, and describe dates, travellers and pacing. Custom briefs are handled as trip enquiries against the same operations desk as published packages.",
  },
  {
    q: "Which destinations does Northridge publish?",
    a: "The public catalogue currently focuses on Spiti Valley, Ladakh and Manali, plus any additional destination the desk publishes in the CRM. Unpublished drafts never appear on the website.",
  },
];

export function mergeFaqs(...lists: Array<Array<{ q: string; a: string }>>) {
  const seen = new Set<string>();
  const out: Array<{ q: string; a: string }> = [];
  for (const list of lists) {
    for (const item of list) {
      const key = item.q.trim().toLowerCase();
      if (!key || seen.has(key) || !item.a.trim()) continue;
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

export function tripHighlights(pack: PublicPackage) {
  const fromPack = highlightList(pack.highlights);
  if (fromPack.length) return fromPack;
  const profile = profileForDestination(pack.destination);
  return profile?.experiences.slice(0, 4) ?? [];
}

export function tripGallery(pack: PublicPackage) {
  const cover = pack.cover_image_url;
  return galleryForDestination(pack.destination).filter((image) => image !== cover);
}

export function tripFaqs(pack: PublicPackage) {
  const profile = profileForDestination(pack.destination);
  return mergeFaqs(formatFaqs(pack.faqs), profile?.faqs ?? [], PROCESS_FAQS);
}

export function tripOverview(pack: PublicPackage) {
  if (pack.long_description?.trim()) return pack.long_description;
  const profile = profileForDestination(pack.destination);
  const duration = pack.duration_days ? `${pack.duration_days}-day ` : "";
  const type = pack.trip_type ? `${pack.trip_type} ` : "";
  return [
    `${pack.name} is a published ${duration}${type}journey to ${pack.destination} from the Northridge travel desk.`,
    pack.short_description,
    profile?.overview,
    "Inclusions, exclusions and day-by-day notes on this page come from the same catalogue record the operations team uses. Live availability is confirmed after you enquire.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function destinationFaqs(slug: string, published: unknown) {
  const profile = profileForDestination(slug);
  return mergeFaqs(formatFaqs(published), profile?.faqs ?? [], PROCESS_FAQS);
}
