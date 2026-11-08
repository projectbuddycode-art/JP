import Link from "next/link";
import type { PublicTestimonial } from "@/lib/site/types";

export function ReviewCard({ item, compact = false }: { item: PublicTestimonial; compact?: boolean }) {
  const name = item.traveller_name || item.attribution || "Traveller";
  const quote = compact && item.quote.length > 180 ? `${item.quote.slice(0, 180).trim()}…` : item.quote;
  return (
    <article className="site-card h-full p-6">
      {item.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.photo_url} alt="" className="mb-4 h-16 w-16 rounded-full object-cover" />
      ) : (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f4fb] font-serif text-xl text-[#2f9ed8]">
          {name.slice(0, 1)}
        </div>
      )}
      {typeof item.rating === "number" ? (
        <p className="text-sm font-semibold text-[#f4c14e]" aria-label={`${item.rating} out of 5`}>
          {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
        </p>
      ) : null}
      <p className="mt-3 font-serif text-2xl leading-snug text-[#12324d]">“{quote}”</p>
      <p className="mt-4 text-sm text-[#5d6d7a]">
        {name}
        {item.destination ? ` · ${item.destination}` : ""}
        {item.trip_name ? ` · ${item.trip_name}` : ""}
      </p>
      {compact ? (
        <Link href="/reviews" className="mt-4 inline-block text-sm font-semibold text-[#2f9ed8]">Read more</Link>
      ) : null}
    </article>
  );
}
