import Link from "next/link";
import { listPublishedArticles, readingMinutes } from "@/lib/site/catalog";
import { IMAGES } from "@/lib/site/media";
import { pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata() {
  return pageMetadata({
    title: "Travel stories",
    description: "Published planning notes from the Northridge travel desk. Not a substitute for permits or live road advice.",
    path: "/travel-guides",
  });
}

export default async function GuidesPage() {
  const articles = await listPublishedArticles();
  return (
    <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
      <p className="site-kicker">Travel stories</p>
      <h1 className="mt-3 font-serif text-5xl md:text-6xl">Notes from the desk</h1>
      <p className="mt-4 max-w-2xl text-[#5d6d7a]">Articles are drafted in the CRM and appear here only when published.</p>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {articles.length ? articles.map((article) => (
          <Link key={article.id} href={`/travel-guides/${article.slug}`} className="site-card group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.cover_image_url || IMAGES.village} alt="" className="h-56 w-full object-cover" />
            <div className="p-6">
              <p className="site-kicker">{article.category || "Guide"}</p>
              <h2 className="mt-2 font-serif text-3xl">{article.title}</h2>
              <p className="mt-2 text-[#5d6d7a]">{article.excerpt}</p>
              <p className="mt-3 text-xs text-[#8a96a3]">
                {article.author_name || "Northridge desk"} · {readingMinutes(`${article.excerpt ?? ""} ${article.body ?? ""}`)} min read
                {article.destination_slug ? ` · ${article.destination_slug}` : ""}
              </p>
              <span className="mt-4 inline-block text-sm font-semibold text-[#f26b4e]">Read article</span>
            </div>
          </Link>
        )) : (
          <p className="text-[#5d6d7a]">No guides are published yet.</p>
        )}
      </div>
    </main>
  );
}
