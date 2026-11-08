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
    <main className="mx-auto max-w-4xl px-6 pb-24 pt-36">
      <p className="text-[11px] uppercase tracking-[0.32em] text-[#c4a574]">Enquire</p>
      <h1 className="mt-4 font-serif text-5xl md:text-6xl">Plan a Himalayan journey</h1>
      <p className="mt-4 max-w-2xl text-white/65">
        Viewing a Reel or liking a post does not share your phone number. This form is the authorised way to enquire.
      </p>
      <div className="mt-10">
        <JourneyPlanner landingPath="/enquire" />
      </div>
    </main>
  );
}
