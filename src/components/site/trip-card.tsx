import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { PublicPackage } from "@/lib/site/types";
import { publicPackageDto } from "@/lib/site/visibility";
import { DESTINATION_COVERS } from "@/lib/site/defaults";

function slugFromDestination(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function TripCard({ pack }: { pack: PublicPackage }) {
  const dto = publicPackageDto(pack);
  const image =
    dto.cover_image_url ||
    DESTINATION_COVERS[slugFromDestination(pack.destination)] ||
    DESTINATION_COVERS["spiti-valley"];
  const priceLabel =
    dto.price_visibility === "request_quote" || dto.price_visibility === "contact" || dto.price_per_person == null
      ? "Request a quote"
      : dto.price_visibility === "fixed"
        ? formatCurrency(dto.price_per_person, dto.currency)
        : `From ${formatCurrency(dto.price_per_person, dto.currency)}`;
  return (
    <article className="group overflow-hidden border border-white/10 bg-[#14181d]">
      <Link href={`/trips/${pack.slug}`} className="block">
        <div
          className="h-64 bg-cover bg-center transition duration-700 group-hover:scale-[1.03]"
          style={{ backgroundImage: `url(${image})` }}
        />
        <div className="p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#c4a574]">{pack.destination}</p>
          <h3 className="mt-2 font-serif text-3xl text-[#f4efe6]">{pack.name}</h3>
          <p className="mt-3 text-sm text-white/60">{pack.short_description}</p>
          <p className="mt-4 text-sm text-white/80">
            {pack.duration_days ? `${pack.duration_days} days` : "Duration on request"} · {priceLabel}
          </p>
          <span className="mt-4 inline-block text-sm text-[#c4a574]">View itinerary</span>
        </div>
      </Link>
    </article>
  );
}
