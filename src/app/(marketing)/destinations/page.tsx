import Link from "next/link";
import { listPublishedDestinations } from "@/lib/site/catalog";
import { DESTINATION_PROFILES, coverForDestination } from "@/lib/site/media";
import { pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata() {
  return pageMetadata({
    title: "Destinations",
    description: "Spiti Valley, Manali, and Ladakh — destinations with published Northridge itineraries.",
    path: "/destinations",
  });
}

const FALLBACK = [
  { slug: "spiti-valley", name: "Spiti Valley", summary: DESTINATION_PROFILES["spiti-valley"].pull },
  { slug: "ladakh", name: "Ladakh", summary: DESTINATION_PROFILES.ladakh.pull },
  { slug: "manali", name: "Manali", summary: DESTINATION_PROFILES.manali.pull },
];

export default async function DestinationsPage() {
  const destinations = await listPublishedDestinations();
  const rows = destinations.length ? destinations : FALLBACK;
  return (
    <main className="px-6 pb-24 pt-32">
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] uppercase tracking-[0.32em] text-[#c4a574]">Destinations</p>
        <h1 className="mt-4 font-serif text-5xl md:text-7xl">The Himalayas, as we travel them.</h1>
        <p className="mt-5 max-w-2xl text-white/65">
          Additional destinations can be published from the CRM without a code change. We do not invent season or permit facts here.
        </p>
        <div className="mt-16 space-y-8">
          {rows.map((item, index) => (
            <Link
              key={item.slug}
              href={`/destinations/${item.slug}`}
              className="group grid min-h-[380px] overflow-hidden md:grid-cols-12"
            >
              <div className={`relative min-h-[280px] md:col-span-7 ${index % 2 ? "md:order-2" : ""}`}>
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.04]"
                  style={{ backgroundImage: `url(${coverForDestination(item.slug)})` }}
                />
              </div>
              <div className={`flex flex-col justify-end bg-[#10130f] p-8 md:col-span-5 md:p-12 ${index % 2 ? "md:order-1" : ""}`}>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#c4a574]">
                  {DESTINATION_PROFILES[item.slug]?.kicker ?? "Destination"}
                </p>
                <h2 className="mt-3 font-serif text-4xl">{item.name}</h2>
                <p className="mt-3 text-sm text-white/65">{item.summary || DESTINATION_PROFILES[item.slug]?.pull}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
