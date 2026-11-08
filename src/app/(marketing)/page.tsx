import Link from "next/link";
import { CinematicHero } from "@/components/site/cinematic-hero";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { FaqList } from "@/components/site/faq-list";
import { JsonLd } from "@/components/site/json-ld";
import { OfferBanner } from "@/components/site/offer-banner";
import { Reveal } from "@/components/site/reveal";
import { ReviewCard } from "@/components/site/review-card";
import { TravellerGallery } from "@/components/site/traveller-gallery";
import { TripDiscovery } from "@/components/site/trip-discovery";
import { GroupTripCard } from "@/components/site/group-trip-card";
import {
  getWebsitePage,
  listApprovedTestimonials,
  listPublicDepartures,
  listPublishedArticles,
  listPublishedDestinations,
  listPublishedOffers,
  listPublishedPackages,
  readingMinutes,
} from "@/lib/site/catalog";
import { DEFAULT_HOME, HOW_IT_WORKS, WHY_US } from "@/lib/site/defaults";
import { PROCESS_FAQS } from "@/lib/site/editorial";
import { DESTINATION_PROFILES, IMAGES, coverForDestination } from "@/lib/site/media";
import { breadcrumbJsonLd, faqJsonLd, howToEnquireJsonLd, itemListJsonLd, organizationJsonLd, pageMetadata, websiteJsonLd } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata() {
  const page = await getWebsitePage("home");
  const content = (page?.content ?? {}) as Record<string, string>;
  return pageMetadata({
    title: page?.seo_title || content.seoTitle || "Himalayan journeys",
    description: page?.seo_description || content.heroSupporting || content.heroSubheading || DEFAULT_HOME.heroSupporting,
    path: "/",
    image: DEFAULT_HOME.heroImage,
    keywords: ["Spiti Valley tour", "Ladakh road trip", "Manali holiday", "Himalayan travel", "Northridge"],
  });
}

const FALLBACK_DESTINATIONS = [
  { slug: "spiti-valley", name: "Spiti Valley", summary: DESTINATION_PROFILES["spiti-valley"].pull },
  { slug: "ladakh", name: "Ladakh", summary: DESTINATION_PROFILES.ladakh.pull },
  { slug: "manali", name: "Manali", summary: DESTINATION_PROFILES.manali.pull },
];

const ACCENTS = ["bg-[#e8f4fb]", "bg-[#fff4e8]", "bg-[#eaf7f1]", "bg-[#ffece7]"];

export default async function HomePage() {
  const [page, packages, destinations, testimonials, articles, offers, departures] = await Promise.all([
    getWebsitePage("home"),
    listPublishedPackages(),
    listPublishedDestinations(),
    listApprovedTestimonials(),
    listPublishedArticles(),
    listPublishedOffers(),
    listPublicDepartures(),
  ]);
  const content = { ...DEFAULT_HOME, ...((page?.content ?? {}) as Record<string, string>) };
  const destRows = destinations.length ? destinations : FALLBACK_DESTINATIONS;
  const gallery = [
    ...DESTINATION_PROFILES["spiti-valley"].gallery.map((src) => ({ src, category: "spiti", alt: "Spiti" })),
    ...DESTINATION_PROFILES.ladakh.gallery.map((src) => ({ src, category: "ladakh", alt: "Ladakh" })),
    ...DESTINATION_PROFILES.manali.gallery.map((src) => ({ src, category: "manali", alt: "Manali" })),
    { src: IMAGES.roads, category: "road", alt: "Road trip" },
    { src: IMAGES.village, category: "group", alt: "Group travel" },
  ];

  return (
    <div>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={howToEnquireJsonLd()} />
      <JsonLd data={faqJsonLd(PROCESS_FAQS)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }])} />
      {packages.length ? (
        <JsonLd
          data={itemListJsonLd(
            "Published Himalayan journeys",
            packages.map((pack) => ({ name: pack.name, path: `/trips/${pack.slug}` })),
          )}
        />
      ) : null}

      <CinematicHero
        heading={content.heroHeading}
        subheading={content.heroSubheading}
        supporting={content.heroSupporting}
        image={content.heroImage || DEFAULT_HOME.heroImage}
        primaryLabel={content.ctaPrimary}
        secondaryLabel={content.ctaSecondary}
        destinations={destRows.map((item) => ({ slug: item.slug, name: item.name }))}
      />

      <OfferBanner offers={offers} />

      <section id="discover" className="px-6 py-20">
        <Reveal className="mx-auto max-w-6xl">
          <p className="site-kicker">Popular destinations</p>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl">Landscapes we actually operate.</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {destRows.map((item, index) => {
              const profile = DESTINATION_PROFILES[item.slug];
              const count = packages.filter((pack) => pack.destination.toLowerCase().includes(item.name.toLowerCase().split(" ")[0])).length;
              return (
                <article key={item.slug} className="site-card flex flex-col">
                  <div className="relative h-56 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverForDestination(item.slug)} alt={item.name} className="h-full w-full object-cover" />
                    <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${ACCENTS[index % ACCENTS.length]}`}>
                      {profile?.kicker ?? "Destination"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-serif text-3xl">{item.name}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#5d6d7a]">{item.summary || profile?.pull}</p>
                    {count ? <p className="mt-3 text-sm font-medium text-[#2f9ed8]">{count} published trip{count === 1 ? "" : "s"}</p> : null}
                    <Link href={`/destinations/${item.slug}`} className="site-btn-gold mt-6 w-fit">Explore</Link>
                  </div>
                </article>
              );
            })}
          </div>
        </Reveal>
      </section>

      <section className="bg-white py-20">
        <Reveal className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="site-kicker">Trending trips</p>
              <h2 className="mt-3 font-serif text-4xl">Published from the travel desk.</h2>
            </div>
            <Link href="/trips" className="site-btn-ghost">View all packages</Link>
          </div>
          <div className="mt-10">
            {packages.length ? <TripDiscovery packages={packages.slice(0, 9)} departures={departures} /> : <p className="text-[#5d6d7a]">No trips are published yet.</p>}
          </div>
        </Reveal>
      </section>

      {departures.length ? (
        <section className="px-6 py-20">
          <Reveal className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="site-kicker">Upcoming group trips</p>
                <h2 className="mt-3 font-serif text-4xl">Scheduled departures only.</h2>
              </div>
              <Link href="/group-trips" className="site-btn-ghost">All group trips</Link>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {departures.slice(0, 3).map((item) => <GroupTripCard key={item.id} departure={item} />)}
            </div>
          </Reveal>
        </section>
      ) : null}

      <section className="bg-[#fff8e8] py-20">
        <Reveal className="mx-auto max-w-6xl px-6">
          <p className="site-kicker">Why travel with us</p>
          <h2 className="mt-3 font-serif text-4xl">Colourful, careful, and honest about what is confirmed.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {WHY_US.map((item, index) => (
              <article key={item.title} className={`rounded-3xl p-6 ${ACCENTS[index % ACCENTS.length]}`}>
                <h3 className="font-serif text-2xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#3d5364]">{item.body}</p>
              </article>
            ))}
          </div>
          <ol className="mt-12 grid gap-4 md:grid-cols-5">
            {HOW_IT_WORKS.map((item) => (
              <li key={item.step} className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-[11px] font-bold text-[#f26b4e]">{item.step}</p>
                <h3 className="mt-2 font-serif text-xl">{item.title}</h3>
                <p className="mt-2 text-sm text-[#5d6d7a]">{item.body}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      <section className="px-6 py-20">
        <Reveal className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="site-kicker">Traveller experiences</p>
              <h2 className="mt-3 font-serif text-4xl">Words we have permission to share.</h2>
            </div>
            <Link href="/reviews" className="site-btn-ghost">Read / write a review</Link>
          </div>
          {testimonials.length ? (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {testimonials.slice(0, 6).map((item) => <ReviewCard key={item.id} item={item} compact />)}
            </div>
          ) : (
            <p className="mt-8 max-w-xl text-[#5d6d7a]">
              Approved traveller stories appear here once they are published from the CRM with recorded permission. We do not invent reviews.
            </p>
          )}
        </Reveal>
      </section>

      <section className="bg-white px-6 py-20">
        <Reveal className="mx-auto max-w-6xl">
          <p className="site-kicker">Traveller gallery</p>
          <h2 className="mt-3 font-serif text-4xl">Landscapes from the routes we publish.</h2>
          <p className="mt-3 max-w-2xl text-sm text-[#5d6d7a]">Licensed destination photography until studio trip photographs are uploaded in the CRM.</p>
          <div className="mt-8">
            <TravellerGallery items={gallery} />
          </div>
        </Reveal>
      </section>

      {articles.length ? (
        <section className="px-6 py-20">
          <Reveal className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="site-kicker">Travel stories</p>
                <h2 className="mt-3 font-serif text-4xl">Notes from the desk.</h2>
              </div>
              <Link href="/travel-guides" className="site-btn-ghost">All stories</Link>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {articles.slice(0, 3).map((article) => (
                <Link key={article.id} href={`/travel-guides/${article.slug}`} className="site-card group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={article.cover_image_url || IMAGES.village} alt="" className="h-48 w-full object-cover" />
                  <div className="p-5">
                    <p className="site-kicker">{article.category || "Guide"}</p>
                    <h3 className="mt-2 font-serif text-2xl">{article.title}</h3>
                    <p className="mt-2 text-sm text-[#5d6d7a]">{article.excerpt}</p>
                    <p className="mt-3 text-xs text-[#8a96a3]">
                      {article.author_name || "Northridge desk"}
                      {` · ${readingMinutes(`${article.excerpt ?? ""} ${article.body ?? ""}`)} min read`}
                      {article.destination_slug ? ` · ${article.destination_slug}` : ""}
                    </p>
                    <span className="mt-4 inline-block text-sm font-semibold text-[#f26b4e]">Read article</span>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>
        </section>
      ) : null}

      <section className="px-6 py-16">
        <Reveal className="mx-auto max-w-6xl">
          <FaqList faqs={PROCESS_FAQS} />
        </Reveal>
      </section>

      <section className="relative mx-6 mb-8 overflow-hidden rounded-[2.5rem]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMAGES.cta} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[#12324d]/55" />
        <div className="relative mx-auto flex min-h-[52vh] max-w-4xl flex-col items-start justify-end px-6 py-16 text-white">
          <h2 className="font-serif text-4xl md:text-6xl">Your Next Adventure Is Waiting.</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/trips" className="site-btn-gold">Explore trips</Link>
            <Link href="/custom-trip" className="site-btn-ghost border-white text-white">Plan a custom journey</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="font-serif text-4xl">Prefer a short form?</h2>
        <p className="mt-3 text-[#5d6d7a]">Same CRM intake as Plan Your Trip.</p>
        <div className="mt-8">
          <EnquiryForm landingPath="/" />
        </div>
      </section>
    </div>
  );
}
