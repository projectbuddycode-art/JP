import { listPublishedDestinations, listPublishedPackages } from "@/lib/site/catalog";
import { SITE_NAME } from "@/lib/site/defaults";
import { PROCESS_FAQS } from "@/lib/site/editorial";
import { siteUrl } from "@/lib/site/seo";

export async function GET() {
  const [packages, destinations] = await Promise.all([listPublishedPackages(), listPublishedDestinations()]);
  const tripLines = packages.length
    ? packages.map((pack) => `- ${pack.name} (${pack.destination}${pack.duration_days ? `, ${pack.duration_days} days` : ""}): ${siteUrl(`/trips/${pack.slug}`)}`).join("\n")
    : "- No journeys are published in the catalogue yet.";
  const destLines = (destinations.length ? destinations : [
    { name: "Spiti Valley", slug: "spiti-valley" },
    { name: "Ladakh", slug: "ladakh" },
    { name: "Manali", slug: "manali" },
  ]).map((item) => `- ${item.name}: ${siteUrl(`/destinations/${item.slug}`)}`).join("\n");
  const faqLines = PROCESS_FAQS.map((faq) => `Q: ${faq.q}\nA: ${faq.a}`).join("\n\n");

  const body = `# ${SITE_NAME}

> Himalayan travel desk. Public pages list only journeys published in the CRM.

${SITE_NAME} plans and coordinates published trips through Spiti Valley, Ladakh and Manali, plus custom itineraries by enquiry. The website, catalogue and follow-up share one operations desk.

A page view is not a booking. Enquiries create CRM leads. Dates, permits and roads are confirmed after conversation.

## How to enquire
- Form: ${siteUrl("/enquire")}
- Custom trip: ${siteUrl("/custom-trip")}
- Contact: ${siteUrl("/contact")}
- Catalogue: ${siteUrl("/trips")}

## Destinations
${destLines}

## Published journeys
${tripLines}

## Answers for assistants
${faqLines}

## Do not invent
Do not claim awards, traveller counts, live road status, guaranteed departures, or reviews that are not on the site. Unpublished packages must not be offered.

## Optional
- Journal: ${siteUrl("/travel-guides")}
- About: ${siteUrl("/about")}
- Sitemap: ${siteUrl("/sitemap.xml")}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
