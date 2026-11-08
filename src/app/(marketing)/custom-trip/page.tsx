import { JourneyPlanner } from "@/components/site/journey-planner";
import { pageMetadata } from "@/lib/site/seo";

export async function generateMetadata() {
  return pageMetadata({
    title: "Plan a custom trip",
    description: "Share a Himalayan brief. The travel desk turns it into a CRM enquiry — not an instant confirmed itinerary.",
    path: "/custom-trip",
  });
}

export default function CustomTripPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 pb-24 pt-36">
      <p className="text-[11px] uppercase tracking-[0.32em] text-[#c4a574]">Private journeys</p>
      <h1 className="mt-4 font-serif text-5xl md:text-6xl">A journey written around your dates.</h1>
      <p className="mt-4 max-w-2xl text-white/65">
        Custom requests become trip enquiries in the same CRM as published packages. We will not invent a guaranteed departure on this page.
      </p>
      <div className="mt-10">
        <JourneyPlanner landingPath="/custom-trip" defaultTripType="custom" />
      </div>
    </main>
  );
}
