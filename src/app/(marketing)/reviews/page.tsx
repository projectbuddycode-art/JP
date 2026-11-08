import { ReviewCard } from "@/components/site/review-card";
import { ReviewForm } from "@/components/site/review-form";
import { listApprovedTestimonials } from "@/lib/site/catalog";
import { pageMetadata } from "@/lib/site/seo";

export const instant = false;

export async function generateMetadata() {
  return pageMetadata({
    title: "Traveller reviews",
    description: "Approved Northridge traveller reviews with recorded permission. New reviews are published only after desk approval.",
    path: "/reviews",
  });
}

export default async function ReviewsPage() {
  const testimonials = await listApprovedTestimonials();
  return (
    <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
      <p className="site-kicker">Reviews</p>
      <h1 className="mt-3 font-serif text-5xl">Traveller experiences</h1>
      <p className="mt-4 max-w-2xl text-[#5d6d7a]">
        Ratings and photographs appear only when they were submitted with permission and approved in the CRM. We do not copy reviews from other brands.
      </p>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {testimonials.length ? testimonials.map((item) => <ReviewCard key={item.id} item={item} />) : (
          <p className="text-[#5d6d7a]">No approved reviews are published yet.</p>
        )}
      </div>
      <section className="mt-16 max-w-3xl">
        <h2 className="font-serif text-3xl">Share your trip</h2>
        <p className="mt-2 text-sm text-[#5d6d7a]">Submissions wait in moderation. They are not live until a teammate publishes them.</p>
        <div className="mt-6">
          <ReviewForm />
        </div>
      </section>
    </main>
  );
}
