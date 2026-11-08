import { notFound } from "next/navigation";
import Link from "next/link";
import { EnquiryCta } from "@/components/site/enquiry-cta";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { FaqList } from "@/components/site/faq-list";
import { JsonLd } from "@/components/site/json-ld";
import { PhotoGallery } from "@/components/site/photo-gallery";
import { PhotoHero } from "@/components/site/photo-hero";
import { Reveal } from "@/components/site/reveal";
import { ReviewCard } from "@/components/site/review-card";
import { StickyEnquiryBar } from "@/components/site/sticky-enquiry";
import { TripCard, tripPriceLabel } from "@/components/site/trip-card";
import { getPackageBySlug, getPublishedPackage, listApprovedTestimonials, listPublishedPackages, publicPackageDto } from "@/lib/site/catalog";
import { isPubliclyListed } from "@/lib/site/visibility";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { tripFaqs, tripGallery, tripHighlights, tripOverview } from "@/lib/site/editorial";
import { formatItinerary } from "@/lib/site/itinerary";
import { coverForDestination, profileForDestination } from "@/lib/site/media";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, tripJsonLd } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pack = await getPublishedPackage(slug);
  if (!pack) return pageMetadata({ title: "Trip", description: "Trip listing", path: `/trips/${slug}`, index: false });
  const dto = publicPackageDto(pack);
  const description =
    dto.seo_description ||
    pack.short_description ||
    `${pack.name} is a published ${pack.destination} journey from Northridge. Enquire to confirm dates.`;
  return pageMetadata({
    title: dto.seo_title || `${pack.name} | ${pack.destination} journey`,
    description,
    path: `/trips/${slug}`,
    image: dto.cover_image_url,
    keywords: [pack.name, pack.destination, pack.trip_type, "Himalayan tour", "Northridge"].filter(Boolean) as string[],
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
  const faqs = tripFaqs(pack);
  const highlights = tripHighlights(pack);
  const gallery = tripGallery(pack);
  const overview = tripOverview(pack);
  const price = tripPriceLabel(pack);
  const profile = profileForDestination(pack.destination);
  const destSlug = pack.destination.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const related = (await listPublishedPackages(pack.destination)).filter((item) => item.id !== pack.id).slice(0, 3);
  const reviews = await listApprovedTestimonials(pack.id);
  const facts = [
    { label: "Destination", value: pack.destination },
    { label: "Duration", value: pack.duration_days ? `${pack.duration_days} days` : "On request" },
    { label: "Format", value: pack.trip_type || "As published" },
    { label: "Price", value: price },
    pack.departure_points ? { label: "Starts", value: pack.departure_points } : null,
    pack.group_size ? { label: "Group size", value: pack.group_size } : null,
    pack.difficulty ? { label: "Pacing", value: pack.difficulty } : null,
    pack.best_season ? { label: "Season notes", value: pack.best_season } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <article className="pb-28 lg:pb-0">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Journeys", path: "/trips" },
          { name: pack.name, path: `/trips/${slug}` },
        ])}
      />
      <JsonLd data={tripJsonLd(pack, `/trips/${slug}`, faqs)} />
      <JsonLd data={faqJsonLd(faqs)} />
      {preview && !isPubliclyListed(pack) ? (
        <p className="relative z-20 bg-[#f4c14e] px-6 py-2 text-center text-sm text-[#12324d]">Staff preview — this trip is not public.</p>
      ) : null}
      <PhotoHero
        image={cover}
        kicker={`${pack.destination}${pack.region ? ` · ${pack.region}` : ""}`}
        title={pack.name}
        subtitle={pack.short_description ?? undefined}
      >
        <p className="mt-6 text-white/90">
          {pack.duration_days ? `${pack.duration_days} days` : "Duration on request"} · {price}
          {pack.trip_type ? ` · ${pack.trip_type}` : ""}
        </p>
        <EnquiryCta enquireHref="#enquire" path={`/trips/${slug}`} />
      </PhotoHero>

      <dl className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 sm:py-10 lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="border-t border-[#d7e2ee] pt-4">
            <dt className="text-[11px] uppercase tracking-[0.2em] text-[#8a96a3]">{fact.label}</dt>
            <dd className="mt-2 font-serif text-2xl">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1.4fr_0.8fr] lg:gap-16">
        <div>
          <Reveal>
            <h2 className="font-serif text-3xl">About this journey</h2>
            <p className="mt-5 whitespace-pre-wrap text-lg leading-relaxed text-[#3d4a58]">{overview}</p>
            {profile?.whoFor ? <p className="mt-6 text-[#5c6b7a]">{profile.whoFor}</p> : null}
          </Reveal>
          {highlights.length ? (
            <ul className="mt-10 grid gap-3 md:grid-cols-2 text-[#4a5866]">
              {highlights.map((item) => (
                <li key={item} className="border-l border-[#4f8fc4]/50 pl-4">{item}</li>
              ))}
            </ul>
          ) : null}
          <div className="mt-14">
            <h2 className="mb-6 font-serif text-3xl">On the road</h2>
            <PhotoGallery images={gallery} label={pack.name} />
          </div>
          {pack.video_url ? (
            <section className="mt-14">
              <h2 className="mb-6 font-serif text-3xl">Journey film</h2>
              <video className="w-full bg-black" controls preload="metadata" poster={cover}>
                <source src={pack.video_url} type="video/mp4" />
              </video>
            </section>
          ) : null}
          {itinerary.length ? (
            <section className="mt-14">
              <h2 className="font-serif text-3xl">Day-by-day itinerary</h2>
              <p className="mt-2 text-sm text-[#6b7a88]">As written on the published package. The desk may adjust days after your enquiry if roads or permits require it.</p>
              <ol className="mt-6 border-l border-[#d7e2ee]">
                {itinerary.map((day) => (
                  <li key={`${day.day}-${day.title}`} className="relative py-5 pl-8">
                    <span className="absolute top-7 -left-[5px] h-2.5 w-2.5 rounded-full bg-[#4f8fc4]" />
                    <p className="text-sm text-[#3d7ab5]">Day {day.day}{day.location ? ` · ${day.location}` : ""}</p>
                    <h3 className="mt-1 font-serif text-2xl">{day.title}</h3>
                    {day.body ? <p className="mt-2 text-[#4a5866]">{day.body}</p> : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <p className="mt-14 text-[#6b7a88]">A day-by-day route is shown here when the travel desk has published one on this package.</p>
          )}
          <section className="mt-14 grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-2xl">Inclusions</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-[#4a5866]">{pack.inclusions || "Shared after conversation, from the same package record."}</p>
            </div>
            <div>
              <h2 className="font-serif text-2xl">Exclusions</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-[#4a5866]">{pack.exclusions || "Shared after conversation, from the same package record."}</p>
            </div>
            <div>
              <h2 className="font-serif text-2xl">Accommodation</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-[#4a5866]">{pack.accommodation || "Shared after conversation."}</p>
            </div>
            <div>
              <h2 className="font-serif text-2xl">Transport</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-[#4a5866]">{pack.transport || "Shared after conversation."}</p>
            </div>
          </section>
          {pack.cancellation_policy ? (
            <section className="mt-14">
              <h2 className="font-serif text-2xl">Cancellation notes on this package</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-[#4a5866]">{pack.cancellation_policy}</p>
            </section>
          ) : null}
          {reviews.length ? (
            <section className="mt-14">
              <h2 className="font-serif text-3xl">Reviews for this trip</h2>
              <div className="mt-6 grid gap-4">
                {reviews.map((item) => <ReviewCard key={item.id} item={item} />)}
              </div>
            </section>
          ) : null}
          <div className="mt-14">
            <FaqList faqs={faqs} />
          </div>
          <p className="mt-10 text-sm text-[#7a8894]">
            This page is not a booking confirmation. Permits, roads, and live availability are confirmed by the travel desk after your enquiry.
          </p>
          <EnquiryCta enquireHref="#enquire" path={`/trips/${slug}`} />
        </div>
        <aside className="site-card h-fit p-6 lg:sticky lg:top-24" id="enquire">
          <h2 className="font-serif text-3xl">Enquire about this trip</h2>
          <p className="mt-2 text-sm text-[#6b7a88]">{price}</p>
          <p className="mt-2 text-sm text-[#7a8894]">The form writes into the CRM. It does not confirm a seat.</p>
          <div className="mt-6">
            <EnquiryForm destination={pack.destination} packageId={pack.id} tripName={pack.name} tripType={pack.trip_type ?? undefined} landingPath={`/trips/${slug}`} />
          </div>
          <Link href={`/destinations/${destSlug}`} className="mt-6 inline-block text-sm text-[#3d7ab5]">Explore {pack.destination}</Link>
          <br />
          <Link href="/trips" className="mt-2 inline-block text-sm text-[#3d7ab5]">All published trips</Link>
        </aside>
      </div>
      {related.length ? (
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
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
