import { notFound } from "next/navigation";
import { JsonLd } from "@/components/site/json-ld";
import { getPublishedArticle } from "@/lib/site/catalog";
import { articleJsonLd, pageMetadata } from "@/lib/site/seo";

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
    <article className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 sm:pt-10">
      <JsonLd
        data={articleJsonLd({
          title: article.title,
          description: article.excerpt,
          path: `/travel-guides/${slug}`,
          image: article.cover_image_url,
          author: article.author_name,
          datePublished: article.published_at,
        })}
      />
      {article.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.cover_image_url} alt="" className="mb-10 h-72 w-full rounded-3xl object-cover" />
      ) : null}
      <p className="site-kicker">{article.category || "Guide"}</p>
      <h1 className="mt-3 font-serif text-5xl">{article.title}</h1>
      {article.author_name ? <p className="mt-3 text-sm text-[#6b7a88]">{article.author_name}</p> : null}
      <p className="mt-6 text-lg text-[#4a5866]">{article.excerpt}</p>
      <div className="mt-8 whitespace-pre-wrap text-[#3d4a58]">{article.body}</div>
      <p className="mt-10 text-xs text-[#8a96a3]">
        Planning notes are not live weather, permit, or road status. Confirm operational details with the travel desk.
      </p>
    </article>
  );
}
