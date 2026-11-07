import { notFound } from "next/navigation";
import Link from "next/link";
import { TripCard } from "@/components/site/trip-card";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { getPublishedDestination, listPublishedArticles, listPublishedPackages } from "@/lib/site/catalog";
import { DESTINATION_COVERS, DEFAULT_HOME } from "@/lib/site/defaults";
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
  const cover = dest.hero_image_url || DESTINATION_COVERS[slug] || DEFAULT_HOME.heroImage;
  const highlights = Array.isArray(dest.highlights) ? dest.highlights : [];
  const faqs = Array.isArray(dest.faqs) ? dest.faqs : [];
  return (
    <article>
      <header className="relative min-h-[70vh] bg-cover bg-center" style={{ backgroundImage: `url(${cover})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-end px-6 pb-16 pt-32">
          <h1 className="font-serif text-6xl">{dest.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">{dest.summary}</p>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="max-w-3xl whitespace-pre-wrap text-lg text-white/70">{dest.overview}</p>
        {dest.best_season ? (
          <p className="mt-6 text-sm text-[#c4a574]">Season notes from the desk: {dest.best_season}</p>
        ) : (
          <p className="mt-6 text-sm text-white/45">Season, permit, and road notes appear here only after the travel desk publishes them.</p>
        )}
        {highlights.length ? (
          <ul className="mt-8 grid gap-3 md:grid-cols-2 text-white/70">
            {highlights.map((item: string, index: number) => <li key={index}>{item}</li>)}
          </ul>
        ) : null}
        <h2 className="mt-16 font-serif text-4xl">Published trips</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {packages.length ? packages.map((pack) => <TripCard key={pack.id} pack={pack} />) : (
            <p className="text-white/50">No published packages for this destination yet.</p>
          )}
        </div>
        {guides.length ? (
          <section className="mt-16">
            <h2 className="font-serif text-3xl">Guides</h2>
            <ul className="mt-4 space-y-2">
              {guides.map((guide) => (
                <li key={guide.id}><Link className="text-[#c4a574]" href={`/travel-guides/${guide.slug}`}>{guide.title}</Link></li>
              ))}
            </ul>
          </section>
        ) : null}
        {faqs.length ? (
          <section className="mt-16">
            <h2 className="font-serif text-3xl">FAQs</h2>
            <ul className="mt-4 space-y-3 text-white/70">
              {faqs.map((faq: unknown, index: number) => <li key={index}>{typeof faq === "string" ? faq : JSON.stringify(faq)}</li>)}
            </ul>
          </section>
        ) : null}
        <section className="mt-16 max-w-3xl">
          <h2 className="font-serif text-3xl">Plan this destination</h2>
          <div className="mt-6">
            <EnquiryForm destination={dest.name} landingPath={`/destinations/${slug}`} />
          </div>
        </section>
      </div>
    </article>
  );
}
