import { publicEnv } from "@/lib/public-env";
import { SITE_NAME } from "@/lib/site/defaults";

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
}) {
  const url = siteUrl(input.path);
  const title = input.title;
  const branded = input.title.includes(SITE_NAME) ? input.title : `${input.title} · ${SITE_NAME}`;
  return {
    title,
    description: input.description,
    alternates: { canonical: url },
    robots: input.index === false ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: branded,
      description: input.description,
      url,
      siteName: SITE_NAME,
      images: input.image ? [{ url: input.image }] : undefined,
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
    areaServed: ["Spiti Valley", "Manali", "Ladakh"],
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
