import { notFound } from "next/navigation";
import Link from "next/link";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { StickyEnquiryBar } from "@/components/site/sticky-enquiry";
import { TripCard, tripPriceLabel } from "@/components/site/trip-card";
import { getPackageBySlug, getPublishedPackage, listPublishedPackages, publicPackageDto } from "@/lib/site/catalog";
import { isPubliclyListed } from "@/lib/site/visibility";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { formatFaqs, formatItinerary, highlightList } from "@/lib/site/itinerary";
import { coverForDestination } from "@/lib/site/media";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pack = await getPublishedPackage(slug);
  if (!pack) return pageMetadata({ title: "Trip", description: "Trip listing", path: `/trips/${slug}`, index: false });
  const dto = publicPackageDto(pack);
  return pageMetadata({
    title: dto.seo_title || pack.name,
    description: dto.seo_description || pack.short_description || pack.name,
    path: `/trips/${slug}`,
    image: dto.cover_image_url,
  });
}

export default async function TripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const preview = (await searchParams).preview === "1";
  let pack = await getPublishedPackage(slug);
  if (!pack && preview) {
    const { profile } = await getSessionUser();
    if (profile && can(profile, "content.publish")) {
      pack = await getPackageBySlug(slug);
    }
  }
  if (!pack) notFound();
  const dto = publicPackageDto(pack);
  const cover = dto.cover_image_url || coverForDestination(pack.destination);
  const itinerary = formatItinerary(pack.itinerary);
  const faqs = formatFaqs(pack.faqs);
  const highlights = highlightList(pack.highlights);
  const price = tripPriceLabel(pack);
  const related = (await listPublishedPackages(pack.destination)).filter((item) => item.id !== pack.id).slice(0, 3);

  return (
    <article className="pb-20 lg:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Journeys", path: "/trips" },
              { name: pack.name, path: `/trips/${slug}` },
            ]),
          ),
        }}
      />
      {preview && !isPubliclyListed(pack) ? (
        <p className="relative z-20 bg-[#c4a574] px-6 py-2 text-center text-sm text-[#111]">Staff preview — this trip is not public.</p>
      ) : null}
      <header className="relative min-h-[80vh] bg-cover bg-center" style={{ backgroundImage: `url(${cover})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090b] via-black/35 to-black/15" />
        <div className="relative mx-auto flex min-h-[80vh] max-w-6xl flex-col justify-end px-6 pb-16 pt-32">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#c4a574]">{pack.destination}</p>
          <h1 className="mt-3 font-serif text-5xl md:text-7xl">{pack.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">{pack.short_description}</p>
          <p className="mt-6 text-white/80">
            {pack.duration_days ? `${pack.duration_days} days` : "Duration on request"} · {price}
            {pack.trip_type ? ` · ${pack.trip_type}` : ""}
            {pack.departure_points ? ` · ${pack.departure_points}` : ""}
          </p>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          {pack.long_description ? <p className="whitespace-pre-wrap text-lg text-white/75">{pack.long_description}</p> : null}
          {highlights.length ? (
            <ul className="mt-10 grid gap-3 md:grid-cols-2 text-white/70">
              {highlights.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : null}
          {itinerary.length ? (
            <section className="mt-14">
              <h2 className="font-serif text-3xl">Itinerary</h2>
              <ol className="mt-6 border-l border-white/15">
                {itinerary.map((day) => (
                  <li key={`${day.day}-${day.title}`} className="relative py-5 pl-8">
                    <span className="absolute top-7 -left-[5px] h-2.5 w-2.5 rounded-full bg-[#c4a574]" />
                    <p className="text-sm text-[#c4a574]">Day {day.day}</p>
                    <h3 className="mt-1 font-serif text-2xl">{day.title}</h3>
                    {day.location ? <p className="text-sm text-white/50">{day.location}</p> : null}
                    {day.body ? <p className="mt-2 text-white/70">{day.body}</p> : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          <section className="mt-14 grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-2xl">Inclusions</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-white/70">{pack.inclusions || "Shared after conversation."}</p>
            </div>
            <div>
              <h2 className="font-serif text-2xl">Exclusions</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-white/70">{pack.exclusions || "Shared after conversation."}</p>
            </div>
            <div>
              <h2 className="font-serif text-2xl">Accommodation</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-white/70">{pack.accommodation || "Shared after conversation."}</p>
            </div>
            <div>
              <h2 className="font-serif text-2xl">Transport</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-white/70">{pack.transport || "Shared after conversation."}</p>
            </div>
          </section>
          {faqs.length ? (
            <section className="mt-14">
              <h2 className="font-serif text-2xl">Questions we publish</h2>
              <ul className="mt-4 space-y-4 text-sm text-white/70">
                {faqs.map((faq) => (
                  <li key={faq.q}>
                    <p className="font-medium text-white">{faq.q}</p>
                    <p className="mt-1">{faq.a}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <p className="mt-10 text-sm text-white/45">
            This page is not a booking confirmation. Permits, roads, and live availability are confirmed by the travel desk after your enquiry.
          </p>
        </div>
        <aside className="h-fit border border-white/10 p-6 lg:sticky lg:top-24" id="enquire">
          <h2 className="font-serif text-3xl">Enquire about this trip</h2>
          <p className="mt-2 text-sm text-white/55">{price}</p>
          <div className="mt-6">
            <EnquiryForm destination={pack.destination} packageId={pack.id} tripName={pack.name} tripType={pack.trip_type ?? undefined} landingPath={`/trips/${slug}`} />
          </div>
          <Link href="/trips" className="mt-6 inline-block text-sm text-[#c4a574]">All published trips</Link>
        </aside>
      </div>
      {related.length ? (
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <h2 className="font-serif text-3xl">Related journeys</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {related.map((item) => <TripCard key={item.id} pack={item} />)}
          </div>
        </section>
      ) : null}
      <StickyEnquiryBar href="#enquire" label="Enquire about this journey" />
    </article>
  );
}
