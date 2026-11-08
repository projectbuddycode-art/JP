import Link from "next/link";
import { getWebsitePage } from "@/lib/site/catalog";
import { WHY_US } from "@/lib/site/defaults";
import { IMAGES } from "@/lib/site/media";
import { pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata() {
  return pageMetadata({
    title: "Our story",
    description: "Northridge is a Himalayan travel desk for Spiti, Manali, Ladakh, and custom journeys.",
    path: "/about",
  });
}

export default async function AboutPage() {
  const page = await getWebsitePage("about");
  const body = (page?.content as { body?: string } | null)?.body;
  return (
    <main>
      <header className="relative min-h-[60vh] bg-cover bg-center" style={{ backgroundImage: `url(${IMAGES.village})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090b] to-black/30" />
        <div className="relative mx-auto flex min-h-[60vh] max-w-6xl flex-col justify-end px-6 pb-16 pt-32">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#c4a574]">Our story</p>
          <h1 className="mt-3 font-serif text-5xl md:text-7xl">{page?.title || "One desk. One catalogue."}</h1>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-lg leading-relaxed text-white/70">
          {body ||
            "Northridge is the public face of the same operations desk that manages enquiries, packages, and follow-ups. We publish only itineraries that exist in the catalogue. History, awards, and safety certifications appear here only when the owner adds them in the CMS."}
        </p>
        <div className="mt-16 space-y-10">
          {WHY_US.map((item) => (
            <div key={item.title} className="border-t border-white/15 pt-6">
              <h2 className="font-serif text-3xl">{item.title}</h2>
              <p className="mt-3 text-white/60">{item.body}</p>
            </div>
          ))}
        </div>
        <Link href="/custom-trip" className="site-btn-gold mt-12">Plan your journey</Link>
      </div>
    </main>
  );
}
