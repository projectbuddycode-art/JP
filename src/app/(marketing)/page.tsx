import Link from "next/link";
import { CinematicHero } from "@/components/site/cinematic-hero";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { JourneyPlanner } from "@/components/site/journey-planner";
import { Reveal } from "@/components/site/reveal";
import { TripDiscovery } from "@/components/site/trip-discovery";
import {
  getWebsitePage,
  listApprovedTestimonials,
  listPublishedArticles,
  listPublishedDestinations,
  listPublishedPackages,
} from "@/lib/site/catalog";
import { DEFAULT_HOME, HOW_IT_WORKS, SIGNATURE, WHY_US } from "@/lib/site/defaults";
import { formatItinerary } from "@/lib/site/itinerary";
import { DESTINATION_PROFILES, IMAGES, coverForDestination } from "@/lib/site/media";
import { breadcrumbJsonLd, organizationJsonLd, pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata() {
  const page = await getWebsitePage("home");
  const content = (page?.content ?? {}) as Record<string, string>;
  return pageMetadata({
    title: page?.seo_title || content.seoTitle || "Himalayan journeys",
    description: page?.seo_description || content.heroSupporting || content.heroSubheading || DEFAULT_HOME.heroSupporting,
    path: "/",
    image: DEFAULT_HOME.heroImage,
  });
}

const FALLBACK_DESTINATIONS = [
  { slug: "spiti-valley", name: "Spiti Valley", summary: DESTINATION_PROFILES["spiti-valley"].pull },
  { slug: "ladakh", name: "Ladakh", summary: DESTINATION_PROFILES.ladakh.pull },
  { slug: "manali", name: "Manali", summary: DESTINATION_PROFILES.manali.pull },
];

export default async function HomePage() {
  const [page, packages, destinations, testimonials, articles] = await Promise.all([
    getWebsitePage("home"),
    listPublishedPackages(),
    listPublishedDestinations(),
    listApprovedTestimonials(),
    listPublishedArticles(),
  ]);
  const content = { ...DEFAULT_HOME, ...((page?.content ?? {}) as Record<string, string>) };
  const featuredItinerary = packages.find((pack) => formatItinerary(pack.itinerary).length > 0) ?? packages[0];
  const itinerary = featuredItinerary ? formatItinerary(featuredItinerary.itinerary).slice(0, 6) : [];
  const destRows = destinations.length ? destinations : FALLBACK_DESTINATIONS;
  const storyFrames = [
    { image: IMAGES.roads, caption: "Mountain roads" },
    { image: IMAGES.chandratal, caption: "High-altitude lakes" },
    { image: IMAGES.village, caption: "Remote villages" },
    { image: IMAGES.monastery, caption: "Monasteries" },
  ];

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([{ name: "Home", path: "/" }])) }}
      />

      <CinematicHero
        heading={content.heroHeading}
        subheading={content.heroSubheading}
        supporting={content.heroSupporting}
        image={content.heroImage || DEFAULT_HOME.heroImage}
        primaryLabel={content.ctaPrimary}
        secondaryLabel={content.ctaSecondary}
      />

      <section id="discover" className="px-6 py-28">
        <Reveal className="mx-auto max-w-6xl">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#c4a574]">Travel discovery</p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl md:text-6xl">Landscapes we actually operate.</h2>
          <div className="mt-16 space-y-8">
            {destRows.map((item, index) => {
              const profile = DESTINATION_PROFILES[item.slug];
              const image = coverForDestination(item.slug);
              const reverse = index % 2 === 1;
              return (
                <Link
                  key={item.slug}
                  href={`/destinations/${item.slug}`}
                  className={`group grid min-h-[420px] overflow-hidden md:grid-cols-12 ${reverse ? "md:direction-rtl" : ""}`}
                >
                  <div className={`relative md:col-span-7 ${reverse ? "md:order-2" : ""}`}>
                    <div
                      className="absolute inset-0 min-h-[320px] bg-cover bg-center transition duration-700 group-hover:scale-[1.04]"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                  </div>
                  <div className={`flex flex-col justify-end bg-[#10130f] p-8 md:col-span-5 md:p-12 ${reverse ? "md:order-1" : ""}`}>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-[#c4a574]">{profile?.kicker ?? "Destination"}</p>
                    <h3 className="mt-3 font-serif text-4xl md:text-5xl">{item.name}</h3>
                    <p className="mt-4 text-sm leading-relaxed text-white/65">{item.summary || profile?.pull}</p>
                    <span className="mt-6 text-sm text-[#c4a574]">Explore destination</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Reveal>
      </section>

      <section className="bg-[#10130f] py-28">
        <Reveal className="mx-auto max-w-6xl px-6">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#c4a574]">Signature journeys</p>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl">Published from the travel desk.</h2>
          <p className="mt-4 max-w-2xl text-white/55">These cards are live CRM packages. Unpublished itineraries never appear here.</p>
          <div className="mt-12">
            {packages.length ? <TripDiscovery packages={packages} /> : <p className="text-white/50">No trips are published yet.</p>}
          </div>
        </Reveal>
      </section>

      <section className="px-6 py-28">
        <Reveal className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[#c4a574]">A more personal way to travel</p>
            <h2 className="mt-4 font-serif text-4xl md:text-6xl">Built around how you like to travel.</h2>
            <p className="mt-6 max-w-xl text-white/65">
              Northridge is the public face of one operations desk. The website, the catalogue, and the follow-up live in the same system — so what you read here is what the team actually works from.
            </p>
          </div>
          <div className="space-y-8">
            {WHY_US.map((item) => (
              <div key={item.title} className="border-t border-white/15 pt-6">
                <h3 className="font-serif text-2xl">{item.title}</h3>
                <p className="mt-2 text-white/60">{item.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="relative">
        {storyFrames.map((frame) => (
          <div key={frame.caption} className="relative min-h-[70vh] overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${frame.image})` }} />
            <div className="absolute inset-0 bg-black/35" />
            <div className="relative mx-auto flex min-h-[70vh] max-w-6xl items-end px-6 pb-16">
              <p className="font-serif text-4xl text-[#f4efe6] md:text-6xl">{frame.caption}</p>
            </div>
          </div>
        ))}
      </section>

      {featuredItinerary ? (
        <section className="px-6 py-28">
          <Reveal className="mx-auto max-w-6xl">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[#c4a574]">Featured itinerary</p>
            <h2 className="mt-4 font-serif text-4xl md:text-5xl">{featuredItinerary.name}</h2>
            <p className="mt-3 text-white/55">
              {featuredItinerary.destination}
              {featuredItinerary.duration_days ? ` · ${featuredItinerary.duration_days} days` : ""}
              {featuredItinerary.accommodation ? ` · ${featuredItinerary.accommodation}` : ""}
            </p>
            {itinerary.length ? (
              <ol className="mt-12 space-y-0 border-l border-white/15">
                {itinerary.map((day) => (
                  <li key={`${day.day}-${day.title}`} className="relative py-6 pl-8">
                    <span className="absolute top-8 -left-[5px] h-2.5 w-2.5 rounded-full bg-[#c4a574]" />
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#c4a574]">Day {day.day}</p>
                    <h3 className="mt-1 font-serif text-2xl">{day.title}</h3>
                    {day.location ? <p className="text-sm text-white/50">{day.location}</p> : null}
                    {day.body ? <p className="mt-2 max-w-2xl text-sm text-white/60">{day.body}</p> : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-8 text-white/50">A day-by-day route is published on the journey page when the desk has written one.</p>
            )}
            <Link href={`/trips/${featuredItinerary.slug}`} className="site-btn-gold mt-10">
              View full journey
            </Link>
          </Reveal>
        </section>
      ) : null}

      <section className="bg-[#10130f] py-28">
        <Reveal className="mx-auto max-w-6xl px-6">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#c4a574]">Why travel with us</p>
          <h2 className="mt-4 font-serif text-4xl">The path from first look to confirmed journey</h2>
          <ol className="mt-14 grid gap-10 md:grid-cols-5">
            {HOW_IT_WORKS.map((item) => (
              <li key={item.step}>
                <p className="text-[11px] tracking-[0.2em] text-[#c4a574]">{item.step}</p>
                <h3 className="mt-3 font-serif text-2xl">{item.title}</h3>
                <p className="mt-2 text-sm text-white/55">{item.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-16 grid gap-8 md:grid-cols-4">
            {SIGNATURE.map((item) => (
              <div key={item.title} className="border-t border-white/15 pt-5">
                <h3 className="font-serif text-2xl text-[#c4a574]">{item.title}</h3>
                <p className="mt-3 text-sm text-white/60">{item.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="px-6 py-28">
        <Reveal className="mx-auto max-w-6xl">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#c4a574]">Real traveller stories</p>
          <h2 className="mt-4 font-serif text-4xl">Words we have permission to share.</h2>
          {testimonials.length ? (
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {testimonials.map((item) => (
                <blockquote key={item.id} className="border-t border-white/15 pt-8">
                  <p className="font-serif text-3xl leading-snug">“{item.quote}”</p>
                  <footer className="mt-4 text-sm text-white/50">
                    {item.attribution}
                    {item.trip_name ? ` · ${item.trip_name}` : ""}
                  </footer>
                </blockquote>
              ))}
            </div>
          ) : (
            <p className="mt-8 max-w-xl text-white/55">
              Approved traveller stories appear here once they are published from the CRM with recorded permission. We do not invent reviews.
            </p>
          )}
        </Reveal>
      </section>

      <section className="bg-[#10130f] px-6 py-28">
        <Reveal className="mx-auto max-w-6xl">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#c4a574]">Journey planner</p>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl">Tell the desk how you want to travel.</h2>
          <p className="mt-4 max-w-2xl text-white/55">This writes directly into the CRM. Liking a post or watching a Reel does not create a lead.</p>
          <div className="mt-12">
            <JourneyPlanner landingPath="/" />
          </div>
        </Reveal>
      </section>

      {articles.length ? (
        <section className="px-6 py-28">
          <Reveal className="mx-auto max-w-6xl">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[#c4a574]">Travel journal</p>
            <h2 className="mt-4 font-serif text-4xl">Notes from the desk.</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {articles.map((article) => (
                <Link key={article.id} href={`/travel-guides/${article.slug}`} className="group">
                  <div
                    className="h-56 bg-cover bg-center transition duration-700 group-hover:scale-[1.03]"
                    style={{ backgroundImage: `url(${article.cover_image_url || IMAGES.village})` }}
                  />
                  <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#c4a574]">{article.category || "Guide"}</p>
                  <h3 className="mt-2 font-serif text-3xl">{article.title}</h3>
                  <p className="mt-2 text-sm text-white/60">{article.excerpt}</p>
                </Link>
              ))}
            </div>
          </Reveal>
        </section>
      ) : null}

      <section className="relative min-h-[70vh] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${IMAGES.cta})` }} />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-4xl flex-col items-start justify-end px-6 py-24">
          <h2 className="font-serif text-5xl md:text-7xl">Your next great story starts here.</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/trips" className="site-btn-gold">Explore trips</Link>
            <Link href="/custom-trip" className="site-btn-ghost">Plan your journey</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24">
        <h2 className="font-serif text-4xl">Prefer a short form?</h2>
        <p className="mt-3 text-white/60">Same CRM intake as the planner above.</p>
        <div className="mt-8">
          <EnquiryForm landingPath="/" />
        </div>
      </section>
    </div>
  );
}
