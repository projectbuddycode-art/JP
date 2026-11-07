import { EnquiryForm } from "@/components/site/enquiry-form";
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
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-36">
      <h1 className="font-serif text-5xl">A journey written around your dates.</h1>
      <p className="mt-4 text-white/65">
        Custom requests become trip enquiries in the same CRM as published packages. We will not invent a guaranteed departure on this page.
      </p>
      <div className="mt-10">
        <EnquiryForm tripType="custom" landingPath="/custom-trip" />
      </div>
    </main>
  );
}
