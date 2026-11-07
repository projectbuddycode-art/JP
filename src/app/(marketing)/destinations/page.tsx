import Link from "next/link";
import { listPublishedDestinations } from "@/lib/site/catalog";
import { DESTINATION_COVERS, DEFAULT_HOME } from "@/lib/site/defaults";
import { pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata() {
  return pageMetadata({
    title: "Destinations",
    description: "Spiti Valley, Manali, and Ladakh — destinations with published Northridge itineraries.",
    path: "/destinations",
  });
}

export default async function DestinationsPage() {
  const destinations = await listPublishedDestinations();
  const rows = destinations.length
    ? destinations
    : [
        { slug: "spiti-valley", name: "Spiti Valley", summary: "High-altitude circuits." },
        { slug: "manali", name: "Manali", summary: "Himalayan gateway." },
        { slug: "ladakh", name: "Ladakh", summary: "High desert roads." },
      ];
  return (
    <main className="px-6 pb-24 pt-32">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-serif text-5xl">Destinations</h1>
        <p className="mt-4 max-w-2xl text-white/65">Additional destinations can be published from the CRM without a code change.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {rows.map((item) => (
            <Link key={item.slug} href={`/destinations/${item.slug}`} className="relative min-h-[380px] overflow-hidden">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${DESTINATION_COVERS[item.slug] || DEFAULT_HOME.heroImage})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-6">
                <h2 className="font-serif text-3xl">{item.name}</h2>
                <p className="mt-2 text-sm text-white/70">{item.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
