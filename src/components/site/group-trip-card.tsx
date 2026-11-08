import Link from "next/link";
import { tripPriceLabel } from "@/components/site/trip-card";
import type { PublicDeparture } from "@/lib/site/types";

function statusLabel(status: string) {
  if (status === "full") return "Full";
  if (status === "filling") return "Filling";
  if (status === "confirmed") return "Confirmed group";
  return "Open for enquiry";
}

export function GroupTripCard({ departure }: { departure: PublicDeparture }) {
  const pack = departure.package;
  const href = pack ? `/trips/${pack.slug}` : "/enquire";
  return (
    <article className="site-card p-6">
      <p className="site-kicker">{departure.destination || pack?.destination || "Group trip"}</p>
      <h3 className="mt-2 break-words font-serif text-xl sm:text-2xl">{departure.name}</h3>
      <dl className="mt-4 grid gap-2 text-sm text-[#3d5364]">
        <div className="flex justify-between gap-3"><dt className="shrink-0">Departure</dt><dd className="min-w-0 text-right">{departure.start_date}</dd></div>
        {departure.end_date ? <div className="flex justify-between gap-4"><dt>Return</dt><dd>{departure.end_date}</dd></div> : null}
        {departure.duration_days ? <div className="flex justify-between gap-4"><dt>Duration</dt><dd>{departure.duration_days} days</dd></div> : null}
        {pack ? <div className="flex justify-between gap-4"><dt>Price</dt><dd>{tripPriceLabel(pack)}</dd></div> : null}
        {typeof departure.capacity === "number" && departure.capacity > 0 ? (
          <div className="flex justify-between gap-4"><dt>Group capacity</dt><dd>{departure.capacity}</dd></div>
        ) : null}
        {typeof departure.seats_remaining === "number" ? (
          <div className="flex justify-between gap-4"><dt>Seats remaining</dt><dd>{departure.seats_remaining}</dd></div>
        ) : null}
        <div className="flex justify-between gap-4"><dt>Status</dt><dd>{statusLabel(departure.status)}</dd></div>
      </dl>
      <Link href={href} className="site-btn-gold mt-6 w-full">Enquire / view trip</Link>
    </article>
  );
}
