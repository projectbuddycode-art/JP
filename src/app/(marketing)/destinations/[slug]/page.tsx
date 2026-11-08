import { notFound } from "next/navigation";
import Link from "next/link";
import { TripCard } from "@/components/site/trip-card";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { getPublishedDestination, listPublishedArticles, listPublishedPackages } from "@/lib/site/catalog";
import { formatFaqs, formatItinerary, highlightList } from "@/lib/site/itinerary";
import { DESTINATION_PROFILES, IMAGES, coverForDestination } from "@/lib/site/media";
import { pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dest = await getPublishedDestination(slug);
  if (!dest) return pageMetadata({ title: "Destination", description: "Destination", path: `/destinations/${slug}`, index: false });
  return pageMetadata({
    title: dest.seo_title || dest.name,
    description: dest.seo_description || dest.summary || dest.name,
    path: `/destinations/${slug}`,
    image: dest.hero_image_url,
  });
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dest = await getPublishedDestination(slug);
  if (!dest) notFound();
  const packages = await listPublishedPackages(dest.name);
  const guides = await listPublishedArticles(slug);
  const profile = DESTINATION_PROFILES[slug];
  const cover = dest.hero_image_url || coverForDestination(slug);
  const highlights = highlightList(dest.highlights);
  const faqs = formatFaqs(dest.faqs);
  const gallery = profile?.gallery ?? [cover, IMAGES.roads, IMAGES.village];
  const preview = packages[0] ? formatItinerary(packages[0].itinerary).slice(0, 4) : [];
  const layout = slug === "ladakh" ? "wide" : slug === "manali" ? "split" : "editorial";

  return (
    <article>
      <header className="relative min-h-[80vh] bg-cover bg-center" style={{ backgroundImage: `url(${cover})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090b] via-black/30 to-black/20" />
        <div className="relative mx-auto flex min-h-[80vh] max-w-6xl flex-col justify-end px-6 pb-16 pt-32">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#c4a574]">{profile?.kicker ?? dest.region ?? "Destination"}</p>
          <h1 className="mt-3 font-serif text-6xl md:text-8xl">{dest.name}</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/75">{dest.summary || profile?.pull}</p>
        </div>
      </header>

      <div className={`mx-auto px-6 py-20 ${layout === "wide" ? "max-w-7xl" : "max-w-6xl"}`}>
        <div className={layout === "split" ? "grid gap-12 lg:grid-cols-2" : "max-w-3xl"}>
          <p className="whitespace-pre-wrap text-lg leading-relaxed text-white/70">{dest.overview || profile?.pull}</p>
          {dest.best_season ? (
            <p className="text-sm text-[#c4a574]">Season notes from the desk: {dest.best_season}</p>
          ) : (
            <p className="text-sm text-white/45">Season, permit, and road notes appear here only after the travel desk publishes them.</p>
          )}
        </div>

        {profile?.experiences?.length ? (
          <ul className={`mt-14 grid gap-6 ${layout === "wide" ? "md:grid-cols-3" : "md:grid-cols-3"}`}>
            {profile.experiences.map((item) => (
              <li key={item} className="border-t border-white/15 pt-5 font-serif text-2xl">{item}</li>
            ))}
          </ul>
        ) : null}

        {highlights.length ? (
          <ul className="mt-10 grid gap-3 text-white/70 md:grid-cols-2">
            {highlights.map((item) => <li key={item}>{item}</li>)}
          </ul>
        ) : null}

        <section className="mt-20 grid gap-3 md:grid-cols-4">
          {gallery.map((image, index) => (
            <div
              key={image}
              className={`min-h-[220px] bg-cover bg-center ${layout === "editorial" && index === 0 ? "md:col-span-2 md:min-h-[420px]" : ""}`}
              style={{ backgroundImage: `url(${image})` }}
              role="img"
              aria-label={`${dest.name} photography`}
            />
          ))}
        </section>

        <h2 className="mt-20 font-serif text-4xl">Published trips</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {packages.length ? packages.map((pack) => <TripCard key={pack.id} pack={pack} />) : (
            <p className="text-white/50">No published packages for this destination yet.</p>
          )}
        </div>

        {preview.length ? (
          <section className="mt-20">
            <h2 className="font-serif text-3xl">Itinerary preview</h2>
            <p className="mt-2 text-sm text-white/50">From {packages[0].name} — confirm details on the journey page.</p>
            <ol className="mt-8 border-l border-white/15">
              {preview.map((day) => (
                <li key={day.day} className="relative py-4 pl-8">
                  <span className="absolute top-6 -left-[5px] h-2.5 w-2.5 rounded-full bg-[#c4a574]" />
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#c4a574]">Day {day.day}</p>
                  <p className="font-serif text-2xl">{day.title}</p>
                </li>
              ))}
            </ol>
            <Link href={`/trips/${packages[0].slug}`} className="mt-6 inline-block text-sm text-[#c4a574]">View full journey</Link>
          </section>
        ) : null}

        {guides.length ? (
          <section className="mt-20">
            <h2 className="font-serif text-3xl">From the journal</h2>
            <ul className="mt-6 space-y-4">
              {guides.map((guide) => (
                <li key={guide.id}>
                  <Link className="font-serif text-2xl text-[#c4a574]" href={`/travel-guides/${guide.slug}`}>{guide.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {faqs.length ? (
          <section className="mt-20">
            <h2 className="font-serif text-3xl">Questions we publish</h2>
            <ul className="mt-6 space-y-6">
              {faqs.map((faq) => (
                <li key={faq.q}>
                  <h3 className="font-serif text-xl">{faq.q}</h3>
                  <p className="mt-2 text-white/65">{faq.a}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-20 max-w-3xl">
          <h2 className="font-serif text-3xl">Plan this destination</h2>
          <div className="mt-6">
            <EnquiryForm destination={dest.name} landingPath={`/destinations/${slug}`} />
          </div>
        </section>
      </div>
    </article>
  );
}
