import { notFound } from "next/navigation";
import { getPublishedArticle } from "@/lib/site/catalog";
import { pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) return pageMetadata({ title: "Guide", description: "Travel guide", path: `/travel-guides/${slug}`, index: false });
  return pageMetadata({
    title: article.seo_title || article.title,
    description: article.seo_description || article.excerpt || article.title,
    path: `/travel-guides/${slug}`,
    image: article.cover_image_url,
  });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) notFound();
  return (
    <article className="mx-auto max-w-3xl px-6 pb-24 pt-36">
      <p className="text-xs uppercase tracking-[0.2em] text-[#c4a574]">{article.category || "Guide"}</p>
      <h1 className="mt-3 font-serif text-5xl">{article.title}</h1>
      {article.author_name ? <p className="mt-3 text-sm text-white/50">{article.author_name}</p> : null}
      <p className="mt-6 text-lg text-white/70">{article.excerpt}</p>
      <div className="mt-8 whitespace-pre-wrap text-white/75">{article.body}</div>
      <p className="mt-10 text-xs text-white/40">
        Planning notes are not live weather, permit, or road status. Confirm operational details with the travel desk.
      </p>
    </article>
  );
}
