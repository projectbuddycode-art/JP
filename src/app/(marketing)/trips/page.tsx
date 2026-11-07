import { TripCard } from "@/components/site/trip-card";
import { listPublishedPackages } from "@/lib/site/catalog";
import { pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata() {
  return pageMetadata({
    title: "Trips",
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
        <p className="text-xs uppercase tracking-[0.22em] text-[#c4a574]">Catalogue</p>
        <h1 className="mt-3 font-serif text-5xl">Journeys on the desk</h1>
        <p className="mt-4 max-w-2xl text-white/65">
          Every card is a published CRM package. Drafts, scheduled, and unpublished trips are not listed.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {filtered.length ? filtered.map((pack) => <TripCard key={pack.id} pack={pack} />) : (
            <p className="text-white/50">No published trips match this view.</p>
          )}
        </div>
      </div>
    </main>
  );
}
