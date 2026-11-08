import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { PublicPackage } from "@/lib/site/types";
import { publicPackageDto } from "@/lib/site/visibility";
import { coverForDestination } from "@/lib/site/media";

export function tripPriceLabel(pack: PublicPackage) {
  const dto = publicPackageDto(pack);
  if (dto.price_visibility === "request_quote" || dto.price_visibility === "contact" || dto.price_per_person == null) {
    return "Price on request";
  }
  return dto.price_visibility === "fixed"
    ? formatCurrency(dto.price_per_person, dto.currency)
    : `From ${formatCurrency(dto.price_per_person, dto.currency)}`;
}

export function TripCard({
  pack,
  departureDate,
  seatsRemaining,
}: {
  pack: PublicPackage;
  departureDate?: string | null;
  seatsRemaining?: number | null;
}) {
  const dto = publicPackageDto(pack);
  const image = dto.cover_image_url || coverForDestination(pack.destination);
  const priceLabel = tripPriceLabel(pack);
  return (
    <article className="site-card group flex h-full flex-col">
      <Link href={`/trips/${pack.slug}`} className="flex h-full flex-col">
        <div className="relative h-56 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={`${pack.name} in ${pack.destination}`}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
            loading="lazy"
          />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-[#12324d]">{pack.destination}</span>
            {pack.trip_type ? (
              <span className="rounded-full bg-[#f26b4e] px-3 py-1 text-[11px] font-semibold text-white">{pack.trip_type}</span>
            ) : null}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-5">
          <h3 className="break-words font-serif text-xl leading-tight text-[#12324d] sm:text-2xl">{pack.name}</h3>
          {pack.short_description ? <p className="mt-2 line-clamp-2 text-sm text-[#5d6d7a]">{pack.short_description}</p> : null}
          <p className="mt-4 text-sm font-medium text-[#12324d]">
            {pack.duration_days ? `${pack.duration_days} days` : "Duration on request"}
            {` · ${priceLabel}`}
          </p>
          {departureDate ? <p className="mt-1 text-sm text-[#2f8f6b]">Next listed date: {departureDate}</p> : null}
          {typeof seatsRemaining === "number" ? (
            <p className="mt-1 text-sm text-[#2f9ed8]">{seatsRemaining} seats remaining on that departure</p>
          ) : null}
          <span className="mt-auto pt-5 text-sm font-semibold text-[#f26b4e]">
            {pack.trip_type === "custom" ? "Enquire" : "View details"}
          </span>
        </div>
      </Link>
    </article>
  );
}
