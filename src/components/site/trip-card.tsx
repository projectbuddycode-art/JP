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

export function TripCard({ pack, featured = false }: { pack: PublicPackage; featured?: boolean }) {
  const dto = publicPackageDto(pack);
  const image = dto.cover_image_url || coverForDestination(pack.destination);
  const priceLabel = tripPriceLabel(pack);
  return (
    <article className={`group relative overflow-hidden ${featured ? "min-h-[540px]" : "min-h-[420px]"}`}>
      <Link href={`/trips/${pack.slug}`} className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-700 ease-out group-hover:scale-[1.06]"
          style={{ backgroundImage: `url(${image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
        <div className="relative flex h-full min-h-[inherit] flex-col justify-end p-7">
          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.22em] text-[#c4a574]">
            <span>{pack.destination}</span>
            {pack.trip_type ? <span>· {pack.trip_type}</span> : null}
          </div>
          <h3 className="mt-2 font-serif text-3xl text-[#f4efe6]">{pack.name}</h3>
          {pack.short_description ? <p className="mt-2 line-clamp-2 text-sm text-white/70">{pack.short_description}</p> : null}
          <p className="mt-4 text-sm text-white/80">
            {pack.duration_days ? `${pack.duration_days} days` : "Duration on request"}
            {pack.departure_points ? ` · ${pack.departure_points}` : ""}
            {` · ${priceLabel}`}
          </p>
          <span className="mt-4 inline-flex text-sm text-[#c4a574]">
            {pack.trip_type === "custom" ? "Enquire" : "View journey"}
          </span>
        </div>
      </Link>
    </article>
  );
}
