import { pageMetadata } from "@/lib/site/seo";

export async function generateMetadata() {
  return pageMetadata({ title: "Privacy policy", description: "How Northridge handles enquiry information.", path: "/privacy-policy" });
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
      <h1 className="font-serif text-5xl">Privacy policy</h1>
      <p className="mt-6 text-[#4a5866]">
        Enquiry forms store name, phone, and optional travel details in the CRM so the travel desk can respond. Marketing messages require a separate opt-in. Full legal text should be reviewed by the operator before launch; this page is a working placeholder, not legal advice.
      </p>
    </main>
  );
}
