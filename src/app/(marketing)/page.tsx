import Link from "next/link";
import { TripCard } from "@/components/site/trip-card";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { getWebsitePage, listApprovedTestimonials, listPublishedArticles, listPublishedDestinations, listPublishedPackages } from "@/lib/site/catalog";
import { DEFAULT_HOME, DESTINATION_COVERS, HOW_IT_WORKS, SIGNATURE, WHY_US } from "@/lib/site/defaults";
import { breadcrumbJsonLd, organizationJsonLd, pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata() {
  const page = await getWebsitePage("home");
  const content = (page?.content ?? {}) as Record<string, string>;
  return pageMetadata({
    title: page?.seo_title || content.seoTitle || "Himalayan journeys",
    description: page?.seo_description || content.heroSubheading || DEFAULT_HOME.heroSubheading,
    path: "/",
    image: DEFAULT_HOME.heroImage,
  });
}

export default async function HomePage() {
  const [page, packages, destinations, testimonials, articles] = await Promise.all([
    getWebsitePage("home"),
    listPublishedPackages(),
    listPublishedDestinations(),
    listApprovedTestimonials(),
    listPublishedArticles(),
  ]);
  const content = { ...DEFAULT_HOME, ...((page?.content ?? {}) as Record<string, string>) };
  const featured = packages.slice(0, 3);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([{ name: "Home", path: "/" }])) }}
      />
      <section
        className="relative flex min-h-[92vh] items-end bg-cover bg-center"
        style={{ backgroundImage: `url(${content.heroImage || DEFAULT_HOME.heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-24 pt-40">
          <p className="text-xs uppercase tracking-[0.28em] text-[#c4a574]">Spiti · Manali · Ladakh</p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-tight md:text-7xl">{content.heroHeading}</h1>
          <p className="mt-6 max-w-2xl text-lg text-white/75">{content.heroSubheading}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/trips" className="bg-[#c4a574] px-6 py-3 text-sm text-[#111]">{content.ctaPrimary}</Link>
            <Link href="/custom-trip" className="border border-white/40 px-6 py-3 text-sm">{content.ctaSecondary}</Link>
          </div>
          <form action="/trips" className="mt-10 max-w-xl border border-white/20 bg-black/30 p-2 backdrop-blur">
            <label className="sr-only" htmlFor="q">Search destinations</label>
            <div className="flex gap-2">
              <input id="q" name="q" placeholder="Search Spiti, Ladakh, Manali…" className="flex-1 bg-transparent px-3 py-3 text-sm outline-none" />
              <button className="px-4 text-sm text-[#c4a574]">Search</button>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <p className="text-xs uppercase tracking-[0.22em] text-[#c4a574]">Destinations</p>
        <h2 className="mt-3 font-serif text-4xl md:text-5xl">Landscapes we actually operate.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {(destinations.length ? destinations : [
            { slug: "spiti-valley", name: "Spiti Valley", summary: "High-altitude villages and monastery roads." },
            { slug: "manali", name: "Manali", summary: "A mountain gateway for Himalayan road trips." },
            { slug: "ladakh", name: "Ladakh", summary: "High desert lakes and paced journeys." },
          ]).map((item) => (
            <Link key={item.slug} href={`/destinations/${item.slug}`} className="group relative block min-h-[420px] overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${DESTINATION_COVERS[item.slug] || DEFAULT_HOME.heroImage})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" />
              <div className="relative flex h-full flex-col justify-end p-8">
                <h3 className="font-serif text-4xl">{item.name}</h3>
                <p className="mt-2 text-sm text-white/70">{item.summary}</p>
                <span className="mt-4 text-sm text-[#c4a574]">Explore destination</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#10151b] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[#c4a574]">Featured journeys</p>
          <h2 className="mt-3 font-serif text-4xl">Published from the travel desk.</h2>
          <p className="mt-3 max-w-2xl text-white/60">These cards are live CRM packages. Unpublished itineraries never appear here.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {featured.length ? featured.map((pack) => <TripCard key={pack.id} pack={pack} />) : (
              <p className="text-white/50">No trips are published yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="font-serif text-4xl">How we work</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {WHY_US.map((item) => (
            <div key={item.title} className="border-t border-white/15 pt-6">
              <h3 className="font-serif text-2xl">{item.title}</h3>
              <p className="mt-2 text-white/65">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#10151b] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-serif text-4xl">Signature experiences</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-4">
            {SIGNATURE.map((item) => (
              <div key={item.title}>
                <h3 className="font-serif text-2xl text-[#c4a574]">{item.title}</h3>
                <p className="mt-3 text-sm text-white/65">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="font-serif text-4xl">The path from first look to confirmed journey</h2>
        <ol className="mt-12 grid gap-8 md:grid-cols-5">
          {HOW_IT_WORKS.map((item) => (
            <li key={item.step}>
              <p className="text-xs tracking-[0.2em] text-[#c4a574]">{item.step}</p>
              <h3 className="mt-2 font-serif text-2xl">{item.title}</h3>
              <p className="mt-2 text-sm text-white/60">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {testimonials.length ? (
        <section className="bg-[#10151b] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-serif text-4xl">From travellers who agreed to be quoted</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {testimonials.map((item) => (
                <blockquote key={item.id} className="border border-white/10 p-8">
                  <p className="font-serif text-2xl">“{item.quote}”</p>
                  <footer className="mt-4 text-sm text-white/50">{item.attribution}{item.trip_name ? ` · ${item.trip_name}` : ""}</footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {articles.length ? (
        <section className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="font-serif text-4xl">Travel journal</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {articles.map((article) => (
              <Link key={article.id} href={`/travel-guides/${article.slug}`} className="border-t border-white/15 pt-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[#c4a574]">{article.category || "Guide"}</p>
                <h3 className="mt-2 font-serif text-3xl">{article.title}</h3>
                <p className="mt-2 text-sm text-white/60">{article.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="relative overflow-hidden py-28">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${DEFAULT_HOME.heroImage})` }} />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-serif text-5xl">Your next Himalayan journey starts here.</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/trips" className="bg-[#c4a574] px-6 py-3 text-sm text-[#111]">Explore trips</Link>
            <Link href="/custom-trip" className="border border-white/40 px-6 py-3 text-sm">Plan a custom trip</Link>
            <Link href="/contact" className="border border-white/40 px-6 py-3 text-sm">Talk to our travel team</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <h2 className="font-serif text-4xl">Start an enquiry</h2>
        <p className="mt-3 text-white/60">The form writes directly into the CRM. Liking a post or watching a Reel does not create a lead.</p>
        <div className="mt-8">
          <EnquiryForm landingPath="/" />
        </div>
      </section>
    </div>
  );
}
