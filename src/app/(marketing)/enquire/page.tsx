import { EnquiryForm } from "@/components/site/enquiry-form";
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
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-36">
      <h1 className="font-serif text-5xl">Plan a Himalayan journey</h1>
      <p className="mt-4 text-white/65">
        Viewing a Reel or liking a post does not share your phone number. This form is the authorised way to enquire.
      </p>
      <div className="mt-10">
        <EnquiryForm landingPath="/enquire" />
      </div>
    </main>
  );
}
