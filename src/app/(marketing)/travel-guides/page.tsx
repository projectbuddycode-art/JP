import Link from "next/link";
import { listPublishedArticles } from "@/lib/site/catalog";
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
    <main className="mx-auto max-w-4xl px-6 pb-24 pt-36">
      <h1 className="font-serif text-5xl">Travel journal</h1>
      <p className="mt-4 text-white/65">Articles are drafted in the CRM and appear here only when published.</p>
      <div className="mt-12 space-y-8">
        {articles.length ? articles.map((article) => (
          <Link key={article.id} href={`/travel-guides/${article.slug}`} className="block border-t border-white/10 pt-6">
            <p className="text-xs uppercase tracking-[0.18em] text-[#c4a574]">{article.category || "Guide"}</p>
            <h2 className="mt-2 font-serif text-3xl">{article.title}</h2>
            <p className="mt-2 text-white/60">{article.excerpt}</p>
          </Link>
        )) : (
          <p className="text-white/50">No guides are published yet.</p>
        )}
      </div>
    </main>
  );
}
