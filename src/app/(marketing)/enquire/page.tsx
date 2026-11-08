import { JourneyPlanner } from "@/components/site/journey-planner";
import { pageMetadata } from "@/lib/site/seo";

export async function generateMetadata() {
  return pageMetadata({
    title: "Enquire",
    description: "Send a Himalayan travel enquiry. Submissions are stored in the Northridge CRM.",
    path: "/enquire",
  });
}

export default function EnquirePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-24 pt-8 sm:px-6 sm:pt-10">
      <p className="site-kicker">Enquire</p>
      <h1 className="mt-4 font-serif text-3xl sm:text-5xl md:text-6xl">Plan a Himalayan journey</h1>
      <p className="mt-4 max-w-2xl text-[#5c6b7a]">
        Viewing a Reel or liking a post does not share your phone number. This form is the authorised way to enquire.
      </p>
      <div className="mt-10">
        <JourneyPlanner landingPath="/enquire" />
      </div>
    </main>
  );
}
