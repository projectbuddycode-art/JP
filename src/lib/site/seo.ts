import { publicEnv } from "@/lib/public-env";
import { SITE_NAME } from "@/lib/site/defaults";
import { formatItinerary } from "@/lib/site/itinerary";
import type { PublicPackage } from "@/lib/site/types";
import { publicPackageDto } from "@/lib/site/visibility";

export function siteUrl(path = "/") {
  const base = publicEnv().appUrl.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  index?: boolean;
  keywords?: string[];
}) {
  const url = siteUrl(input.path);
  const title = input.title;
  const branded = input.title.includes(SITE_NAME) ? input.title : `${input.title} · ${SITE_NAME}`;
  return {
    title,
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical: url },
    robots: input.index === false ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: branded,
      description: input.description,
      url,
      siteName: SITE_NAME,
      locale: "en_IN",
      images: input.image ? [{ url: input.image, alt: branded }] : undefined,
      type: "website" as const,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: branded,
      description: input.description,
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: SITE_NAME,
    url: siteUrl("/"),
    description:
      "Himalayan travel desk for published journeys through Spiti Valley, Ladakh and Manali, plus custom itineraries by enquiry.",
    areaServed: ["Spiti Valley", "Manali", "Ladakh", "Himachal Pradesh", "India"],
    knowsAbout: ["Spiti Valley tours", "Ladakh road trips", "Manali holidays", "Himalayan custom itineraries"],
    availableLanguage: ["en", "hi"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      url: siteUrl("/enquire"),
      availableLanguage: ["English", "Hindi"],
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl("/trips")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: siteUrl(item.path),
    })),
  };
}

export function faqJsonLd(faqs: Array<{ q: string; a: string }>) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

export function howToEnquireJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to plan a Himalayan journey with Northridge",
    description: "Send an enquiry so the travel desk can confirm dates, format and availability from the same CRM catalogue.",
    step: [
      { "@type": "HowToStep", name: "Choose a destination", text: "Start with Spiti Valley, Ladakh, Manali, or a custom brief." },
      { "@type": "HowToStep", name: "Open a published trip or custom form", text: "Only catalogue packages appear on the website." },
      { "@type": "HowToStep", name: "Send dates and travellers", text: "The enquiry form creates a CRM lead with a follow-up task." },
      { "@type": "HowToStep", name: "Confirm with the desk", text: "A journey is confirmed only after a recorded booking." },
    ],
  };
}

export function tripJsonLd(pack: PublicPackage, path: string, faqs: Array<{ q: string; a: string }>) {
  const dto = publicPackageDto(pack);
  const itinerary = formatItinerary(pack.itinerary);
  const offer =
    dto.price_per_person == null
      ? {
          "@type": "Offer",
          url: siteUrl(path),
          availability: "https://schema.org/PreOrder",
          description: "Price on request after enquiry. Not a confirmed booking.",
        }
      : {
          "@type": "Offer",
          url: siteUrl(path),
          priceCurrency: dto.currency,
          price: dto.price_per_person,
          availability: "https://schema.org/PreOrder",
          description: "Published starting price. Confirmed only after the travel desk records a booking.",
        };
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: pack.name,
    description: dto.seo_description || pack.short_description || pack.name,
    url: siteUrl(path),
    image: dto.cover_image_url || undefined,
    touristType: pack.trip_type || "Himalayan traveller",
    itinerary: itinerary.length
      ? {
          "@type": "ItemList",
          itemListElement: itinerary.map((day, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: `Day ${day.day}: ${day.title}`,
            description: [day.location, day.body].filter(Boolean).join(". "),
          })),
        }
      : undefined,
    offers: offer,
    subjectOf: faqs.length ? faqJsonLd(faqs) : undefined,
  };
}

export function destinationJsonLd(input: { name: string; summary?: string | null; path: string; image?: string | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: input.name,
    description: input.summary || `${input.name} journeys published by ${SITE_NAME}.`,
    url: siteUrl(input.path),
    image: input.image || undefined,
    containedInPlace: { "@type": "Country", name: "India" },
  };
}

export function articleJsonLd(input: {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  author?: string | null;
  datePublished?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description || input.title,
    url: siteUrl(input.path),
    image: input.image || undefined,
    author: { "@type": "Organization", name: input.author || SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME, url: siteUrl("/") },
    datePublished: input.datePublished || undefined,
  };
}

export function itemListJsonLd(name: string, items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: siteUrl(item.path),
    })),
  };
}
