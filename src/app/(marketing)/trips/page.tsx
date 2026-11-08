import { TripDiscovery } from "@/components/site/trip-discovery";
import { listPublishedPackages } from "@/lib/site/catalog";
import { pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata() {
  return pageMetadata({
    title: "Journeys",
    description: "Published Himalayan itineraries from the Northridge travel desk. Availability is confirmed after an enquiry.",
    path: "/trips",
  });
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; destination?: string }>;
}) {
  const params = await searchParams;
  const packages = await listPublishedPackages(params.destination);
  const filtered = params.q
    ? packages.filter((item) =>
        `${item.name} ${item.destination} ${item.short_description}`.toLowerCase().includes(params.q!.toLowerCase()),
      )
    : packages;
  return (
    <main className="px-6 pb-24 pt-32">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] uppercase tracking-[0.32em] text-[#c4a574]">Catalogue</p>
        <h1 className="mt-4 font-serif text-5xl md:text-7xl">Journeys on the desk</h1>
        <p className="mt-4 max-w-2xl text-white/65">
          Every card is a published CRM package. Drafts, scheduled, and unpublished trips are not listed.
        </p>
        <form action="/trips" className="mt-10 max-w-xl border border-white/15 p-2">
          <label className="sr-only" htmlFor="q">Search journeys</label>
          <div className="flex gap-2">
            <input id="q" name="q" defaultValue={params.q} placeholder="Search Spiti, Ladakh, Manali…" className="site-input border-0" />
            <button className="site-btn-gold" type="submit">Search</button>
          </div>
        </form>
        <div className="mt-12">
          <TripDiscovery packages={filtered} />
        </div>
      </div>
    </main>
  );
}
