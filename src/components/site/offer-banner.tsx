import Link from "next/link";
import type { PublicOffer } from "@/lib/site/types";

export function OfferBanner({ offers }: { offers: PublicOffer[] }) {
  if (!offers.length) return null;
  return (
    <section className="px-5 py-8 md:px-6">
      <div className="mx-auto grid max-w-6xl gap-4">
        {offers.map((offer) => (
          <article
            key={offer.id}
            className="overflow-hidden rounded-[2rem] bg-[#12324d] text-white shadow-[0_18px_50px_rgba(18,50,77,0.18)] md:grid md:grid-cols-[1.4fr_0.8fr]"
          >
            <div className="p-8 md:p-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f4c14e]">Current offer</p>
              <h2 className="mt-3 font-serif text-3xl md:text-4xl">{offer.title}</h2>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {offer.discount_label ? <span className="rounded-full bg-[#f26b4e] px-3 py-1">{offer.discount_label}</span> : null}
                {offer.coupon_code ? <span className="rounded-full bg-white/15 px-3 py-1">Code {offer.coupon_code}</span> : null}
                {offer.valid_until ? <span className="rounded-full bg-white/15 px-3 py-1">Until {offer.valid_until}</span> : null}
              </div>
              {offer.applicable_trips ? <p className="mt-4 text-sm text-white/80">{offer.applicable_trips}</p> : null}
              <Link href={offer.cta_href || "/trips"} className="site-btn-gold mt-6">
                {offer.cta_label || "View trips"}
              </Link>
            </div>
            {offer.banner_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={offer.banner_image_url} alt="" className="h-full min-h-[180px] w-full object-cover" />
            ) : (
              <div className="min-h-[160px] bg-gradient-to-br from-[#2f9ed8] to-[#2f8f6b]" />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
