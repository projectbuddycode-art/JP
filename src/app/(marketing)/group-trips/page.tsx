import { GroupTripCard } from "@/components/site/group-trip-card";
import { listPublicDepartures } from "@/lib/site/catalog";
import { pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata() {
  return pageMetadata({
    title: "Group trips",
    description: "Upcoming published group departures from the Northridge travel desk. Seats remaining are shown only from actual departure records.",
    path: "/group-trips",
  });
}

export default async function GroupTripsPage() {
  const departures = await listPublicDepartures();
  const group = departures.filter((item) => {
    const type = (item.package?.trip_type ?? "").toLowerCase();
    return !type || type.includes("group") || item.capacity;
  });
  return (
    <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
      <p className="site-kicker">Group trips</p>
      <h1 className="mt-3 font-serif text-5xl md:text-6xl">Travel with a scheduled group.</h1>
      <p className="mt-4 max-w-2xl text-[#5d6d7a]">
        Only departures that exist in operations are listed. Internal notes, supplier costs and trip-leader contacts stay in the CRM unless they are approved for the public site.
      </p>
      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {group.length ? group.map((item) => <GroupTripCard key={item.id} departure={item} />) : (
          <p className="text-[#5d6d7a]">No public group departures are scheduled right now. You can still send a group enquiry.</p>
        )}
      </div>
    </main>
  );
}
