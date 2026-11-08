import Link from "next/link";
import { listPublishedArticles } from "@/lib/site/catalog";
import { IMAGES } from "@/lib/site/media";
import { pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata() {
  return pageMetadata({
    title: "Travel journal",
    description: "Published planning notes from the Northridge travel desk. Not a substitute for permits or live road advice.",
    path: "/travel-guides",
  });
}

export default async function GuidesPage() {
  const articles = await listPublishedArticles();
  return (
    <main className="mx-auto max-w-6xl px-6 pb-24 pt-36">
      <p className="text-[11px] uppercase tracking-[0.32em] text-[#c4a574]">Travel journal</p>
      <h1 className="mt-4 font-serif text-5xl md:text-7xl">Notes from the desk</h1>
      <p className="mt-4 max-w-2xl text-white/65">Articles are drafted in the CRM and appear here only when published.</p>
      <div className="mt-16 grid gap-10 md:grid-cols-2">
        {articles.length ? articles.map((article, index) => (
          <Link key={article.id} href={`/travel-guides/${article.slug}`} className={`group ${index === 0 ? "md:col-span-2" : ""}`}>
            <div
              className={`bg-cover bg-center transition duration-700 group-hover:scale-[1.02] ${index === 0 ? "h-80" : "h-56"}`}
              style={{ backgroundImage: `url(${article.cover_image_url || IMAGES.village})` }}
            />
            <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#c4a574]">{article.category || "Guide"}</p>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl">{article.title}</h2>
            <p className="mt-2 text-white/60">{article.excerpt}</p>
          </Link>
        )) : (
          <p className="text-white/50">No guides are published yet.</p>
        )}
      </div>
    </main>
  );
}
