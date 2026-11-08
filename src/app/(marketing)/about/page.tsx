import Link from "next/link";
import { FaqList } from "@/components/site/faq-list";
import { PhotoHero } from "@/components/site/photo-hero";
import { ReviewCard } from "@/components/site/review-card";
import { getWebsitePage, listApprovedTestimonials } from "@/lib/site/catalog";
import { WHY_US } from "@/lib/site/defaults";
import { PROCESS_FAQS } from "@/lib/site/editorial";
import { IMAGES } from "@/lib/site/media";
import { pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata() {
  return pageMetadata({
    title: "About us",
    description: "Northridge is a Himalayan travel desk for Spiti, Manali, Ladakh, and custom journeys.",
    path: "/about",
  });
}

export default async function AboutPage() {
  const [page, testimonials] = await Promise.all([getWebsitePage("about"), listApprovedTestimonials()]);
  const body = (page?.content as Record<string, string> | null) ?? {};
  const stats = [body.verifiedStatOne, body.verifiedStatTwo].filter(Boolean);
  return (
    <main>
      <PhotoHero image={IMAGES.village} kicker="About us" title={page?.title || "One desk. One catalogue."} />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <p className="text-lg leading-relaxed text-[#3d5364]">
          {body.body ||
            "Northridge is the public face of the same operations desk that manages enquiries, packages, and follow-ups. We publish only itineraries that exist in the catalogue. History, awards, and safety certifications appear here only when the owner adds them in the CMS."}
        </p>
        {body.mission ? (
          <section className="mt-12 rounded-3xl bg-[#e8f4fb] p-8">
            <h2 className="font-serif text-3xl">Mission</h2>
            <p className="mt-3 text-[#3d5364]">{body.mission}</p>
          </section>
        ) : null}
        {body.philosophy ? (
          <section className="mt-8 rounded-3xl bg-[#fff4e8] p-8">
            <h2 className="font-serif text-3xl">Travel philosophy</h2>
            <p className="mt-3 text-[#3d5364]">{body.philosophy}</p>
          </section>
        ) : null}
        {stats.length ? (
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {stats.map((item) => (
              <li key={item} className="rounded-3xl bg-white p-6 shadow-sm font-serif text-2xl">{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-sm text-[#8a96a3]">Company statistics appear here only when the owner publishes verified figures in the CMS.</p>
        )}
        <div className="mt-16 space-y-6">
          {WHY_US.map((item) => (
            <div key={item.title} className="border-t border-[#dce7ef] pt-6">
              <h2 className="font-serif text-3xl">{item.title}</h2>
              <p className="mt-3 text-[#5d6d7a]">{item.body}</p>
            </div>
          ))}
        </div>
        {testimonials.length ? (
          <section className="mt-16">
            <h2 className="font-serif text-3xl">Traveller voices</h2>
            <div className="mt-6 grid gap-4">
              {testimonials.slice(0, 3).map((item) => <ReviewCard key={item.id} item={item} compact />)}
            </div>
          </section>
        ) : null}
        <div className="mt-16">
          <FaqList faqs={PROCESS_FAQS} />
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/custom-trip" className="site-btn-gold">Plan your journey</Link>
          <Link href="/contact" className="site-btn-ghost">Contact</Link>
        </div>
      </div>
    </main>
  );
}
