import { JsonLd } from "@/components/site/json-ld";
import { TripDiscovery } from "@/components/site/trip-discovery";
import { listPublicDepartures, listPublishedPackages } from "@/lib/site/catalog";
import { itemListJsonLd, pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata() {
  return pageMetadata({
    title: "Tour packages",
    description: "Browse published Spiti, Ladakh and Manali itineraries from the Northridge travel desk. Availability is confirmed after an enquiry.",
    path: "/trips",
    keywords: ["Spiti tour packages", "Ladakh itinerary", "Manali trip", "Himalayan group departure"],
  });
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; destination?: string }>;
}) {
  const params = await searchParams;
  const [packages, departures] = await Promise.all([listPublishedPackages(params.destination), listPublicDepartures()]);
  const filtered = params.q
    ? packages.filter((item) =>
        `${item.name} ${item.destination} ${item.short_description}`.toLowerCase().includes(params.q!.toLowerCase()),
      )
    : packages;
  return (
    <main className="px-6 pb-24 pt-10">
      <JsonLd
        data={itemListJsonLd(
          "Published Himalayan journeys",
          filtered.map((pack) => ({ name: pack.name, path: `/trips/${pack.slug}` })),
        )}
      />
      <div className="mx-auto max-w-6xl">
        <p className="site-kicker">Tour packages</p>
        <h1 className="mt-3 font-serif text-5xl md:text-6xl">Find a Himalayan journey.</h1>
        <p className="mt-4 max-w-2xl text-[#5d6d7a]">
          Every card is a published CRM package. Drafts, scheduled, and unpublished trips are not listed.
        </p>
        <form action="/trips" className="mt-8 rounded-3xl bg-white p-3 shadow-sm">
          <label className="sr-only" htmlFor="q">Search journeys</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input id="q" name="q" defaultValue={params.q} placeholder="Search Spiti, Ladakh, Manali…" className="site-input" />
            <button className="site-btn-gold" type="submit">Search</button>
          </div>
        </form>
        <div className="mt-12">
          <TripDiscovery packages={filtered} departures={departures} />
        </div>
      </div>
    </main>
  );
}
