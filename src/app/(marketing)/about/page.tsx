import { getWebsitePage } from "@/lib/site/catalog";
import { pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata() {
  return pageMetadata({
    title: "About",
    description: "Northridge is a Himalayan travel desk for Spiti, Manali, Ladakh, and custom journeys.",
    path: "/about",
  });
}

export default async function AboutPage() {
  const page = await getWebsitePage("about");
  const body = (page?.content as { body?: string } | null)?.body;
  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-36">
      <h1 className="font-serif text-5xl">{page?.title || "The travel desk"}</h1>
      <p className="mt-6 text-lg text-white/70">
        {body ||
          "Northridge is the public face of the same operations desk that manages enquiries, packages, and follow-ups. We publish only itineraries that exist in the catalogue. History, awards, and safety certifications appear here only when the owner adds them in the CMS."}
      </p>
    </main>
  );
}
