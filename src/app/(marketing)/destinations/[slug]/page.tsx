import { notFound } from "next/navigation";
import Link from "next/link";
import { EnquiryCta } from "@/components/site/enquiry-cta";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { FaqList } from "@/components/site/faq-list";
import { JsonLd } from "@/components/site/json-ld";
import { PhotoGallery } from "@/components/site/photo-gallery";
import { PhotoHero } from "@/components/site/photo-hero";
import { TripCard } from "@/components/site/trip-card";
import { getPublishedDestination, listPublishedArticles, listPublishedPackages } from "@/lib/site/catalog";
import { destinationFaqs } from "@/lib/site/editorial";
import { formatItinerary, highlightList } from "@/lib/site/itinerary";
import { galleryForDestination, profileForDestination, coverForDestination } from "@/lib/site/media";
import { breadcrumbJsonLd, destinationJsonLd, faqJsonLd, itemListJsonLd, pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dest = await getPublishedDestination(slug);
  if (!dest) return pageMetadata({ title: "Destination", description: "Destination", path: `/destinations/${slug}`, index: false });
  const profile = profileForDestination(slug);
  return pageMetadata({
    title: dest.seo_title || `${dest.name} tours and journeys`,
    description:
      dest.seo_description ||
      dest.summary ||
      profile?.pull ||
      `Published ${dest.name} itineraries from the Northridge travel desk.`,
    path: `/destinations/${slug}`,
    image: dest.hero_image_url,
    keywords: [dest.name, "Himalayan tour", "Northridge", "Spiti", "Ladakh", "Manali"].filter(Boolean),
  });
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dest = await getPublishedDestination(slug);
  if (!dest) notFound();
  const packages = await listPublishedPackages(dest.name);
  const guides = await listPublishedArticles(slug);
  const profile = profileForDestination(slug);
  const cover = dest.hero_image_url || coverForDestination(slug);
  const highlights = highlightList(dest.highlights);
  const faqs = destinationFaqs(slug, dest.faqs);
  const gallery = galleryForDestination(slug).filter((image) => image !== cover);
  const preview = packages[0] ? formatItinerary(packages[0].itinerary).slice(0, 5) : [];
  const layout = slug === "ladakh" ? "wide" : slug === "manali" ? "split" : "editorial";

  return (
    <article>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Destinations", path: "/destinations" },
          { name: dest.name, path: `/destinations/${slug}` },
        ])}
      />
      <JsonLd data={destinationJsonLd({ name: dest.name, summary: dest.summary || profile?.pull, path: `/destinations/${slug}`, image: cover })} />
      <JsonLd data={faqJsonLd(faqs)} />
      {packages.length ? (
        <JsonLd
          data={itemListJsonLd(
            `Published ${dest.name} journeys`,
            packages.map((pack) => ({ name: pack.name, path: `/trips/${pack.slug}` })),
          )}
        />
      ) : null}

      <PhotoHero
        image={cover}
        kicker={profile?.kicker ?? dest.region ?? "Destination"}
        title={dest.name}
        subtitle={dest.summary || profile?.pull}
      >
        <EnquiryCta enquireHref="#plan" path={`/destinations/${slug}`} />
      </PhotoHero>

      <div className={`mx-auto px-6 py-20 ${layout === "wide" ? "max-w-7xl" : "max-w-6xl"}`}>
        <div className={layout === "split" ? "grid gap-12 lg:grid-cols-2" : "max-w-3xl"}>
          <div>
            <h2 className="font-serif text-3xl">Where this destination sits</h2>
            <p className="mt-5 whitespace-pre-wrap text-lg leading-relaxed text-[#4a5866]">
              {dest.overview || profile?.overview}
            </p>
            {dest.overview && profile?.overview && dest.overview !== profile.overview ? (
              <p className="mt-6 text-[#5c6b7a]">{profile.overview}</p>
            ) : null}
            {profile?.whoFor ? <p className="mt-6 text-[#6b7a88]">{profile.whoFor}</p> : null}
          </div>
          {dest.best_season ? (
            <p className="text-sm text-[#3d7ab5]">Season notes from the desk: {dest.best_season}</p>
          ) : (
            <p className="text-sm text-[#7a8894]">Season, permit, and road notes appear here only after the travel desk publishes them.</p>
          )}
        </div>

        {profile?.experiences?.length ? (
          <ul className="mt-14 grid gap-6 md:grid-cols-4">
            {profile.experiences.map((item) => (
              <li key={item} className="border-t border-[#d7e2ee] pt-5 font-serif text-2xl">{item}</li>
            ))}
          </ul>
        ) : null}

        {highlights.length ? (
          <ul className="mt-10 grid gap-3 text-[#4a5866] md:grid-cols-2">
            {highlights.map((item) => <li key={item}>{item}</li>)}
          </ul>
        ) : null}

        <section className="mt-20">
          <h2 className="mb-6 font-serif text-3xl">Photography from this landscape</h2>
          <PhotoGallery images={gallery} label={dest.name} />
        </section>

        <h2 className="mt-20 font-serif text-4xl">Published {dest.name} trips</h2>
        <p className="mt-3 max-w-2xl text-[#6b7a88]">These cards are live CRM packages. Drafts never appear here.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {packages.length ? packages.map((pack) => <TripCard key={pack.id} pack={pack} />) : (
            <p className="text-[#6b7a88]">No published packages for this destination yet.</p>
          )}
        </div>

        {preview.length ? (
          <section className="mt-20">
            <h2 className="font-serif text-3xl">Itinerary preview</h2>
            <p className="mt-2 text-sm text-[#6b7a88]">From {packages[0].name} — confirm details on the journey page.</p>
            <ol className="mt-8 border-l border-[#d7e2ee]">
              {preview.map((day) => (
                <li key={day.day} className="relative py-4 pl-8">
                  <span className="absolute top-6 -left-[5px] h-2.5 w-2.5 rounded-full bg-[#4f8fc4]" />
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#3d7ab5]">Day {day.day}{day.location ? ` · ${day.location}` : ""}</p>
                  <p className="font-serif text-2xl">{day.title}</p>
                  {day.body ? <p className="mt-1 text-sm text-[#6b7a88]">{day.body}</p> : null}
                </li>
              ))}
            </ol>
            <Link href={`/trips/${packages[0].slug}`} className="mt-6 inline-block text-sm text-[#3d7ab5]">View full journey</Link>
          </section>
        ) : null}

        {guides.length ? (
          <section className="mt-20">
            <h2 className="font-serif text-3xl">From the journal</h2>
            <ul className="mt-6 space-y-4">
              {guides.map((guide) => (
                <li key={guide.id}>
                  <Link className="font-serif text-2xl text-[#3d7ab5]" href={`/travel-guides/${guide.slug}`}>{guide.title}</Link>
                  {guide.excerpt ? <p className="mt-1 text-sm text-[#6b7a88]">{guide.excerpt}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-20">
          <FaqList faqs={faqs} />
        </div>

        <section className="mt-20 max-w-3xl" id="plan">
          <h2 className="font-serif text-3xl">Plan this destination</h2>
          <p className="mt-3 text-[#6b7a88]">Tell the desk how you want to travel. This writes into the CRM.</p>
          <div className="mt-6">
            <EnquiryForm destination={dest.name} landingPath={`/destinations/${slug}`} />
          </div>
        </section>
      </div>
    </article>
  );
}
