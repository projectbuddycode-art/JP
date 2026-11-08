import Link from "next/link";
import { listPublishedDestinations, listPublishedPackages } from "@/lib/site/catalog";
import { DESTINATION_PROFILES, coverForDestination } from "@/lib/site/media";
import { pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata() {
  return pageMetadata({
    title: "Destinations",
    description: "Destination pages for Spiti Valley, Ladakh and Manali — with published Northridge itineraries, photography and enquiry forms.",
    keywords: ["Spiti Valley", "Ladakh", "Manali", "Himachal tour"],
    path: "/destinations",
  });
}

const FALLBACK = [
  { slug: "spiti-valley", name: "Spiti Valley", summary: DESTINATION_PROFILES["spiti-valley"].pull },
  { slug: "ladakh", name: "Ladakh", summary: DESTINATION_PROFILES.ladakh.pull },
  { slug: "manali", name: "Manali", summary: DESTINATION_PROFILES.manali.pull },
];

export default async function DestinationsPage() {
  const [destinations, packages] = await Promise.all([listPublishedDestinations(), listPublishedPackages()]);
  const rows = destinations.length ? destinations : FALLBACK;
  return (
    <main className="px-6 pb-24 pt-10">
      <div className="mx-auto max-w-6xl">
        <p className="site-kicker">Destinations</p>
        <h1 className="mt-3 font-serif text-5xl md:text-6xl">The Himalayas, as we travel them.</h1>
        <p className="mt-5 max-w-2xl text-[#5d6d7a]">
          Additional destinations can be published from the CRM without a code change. We do not invent season or permit facts here.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {rows.map((item) => {
            const count = packages.filter((pack) => pack.destination.toLowerCase().includes(item.name.toLowerCase().split(" ")[0])).length;
            return (
              <Link key={item.slug} href={`/destinations/${item.slug}`} className="site-card group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverForDestination(item.slug)} alt={item.name} className="h-56 w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                <div className="p-6">
                  <p className="site-kicker">{DESTINATION_PROFILES[item.slug]?.kicker ?? "Destination"}</p>
                  <h2 className="mt-2 font-serif text-3xl">{item.name}</h2>
                  <p className="mt-3 text-sm text-[#5d6d7a]">{item.summary || DESTINATION_PROFILES[item.slug]?.pull}</p>
                  {count ? <p className="mt-3 text-sm font-medium text-[#2f9ed8]">{count} published trips</p> : null}
                  <span className="mt-5 inline-block text-sm font-semibold text-[#f26b4e]">Explore</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
