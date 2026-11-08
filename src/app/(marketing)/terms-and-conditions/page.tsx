import { pageMetadata } from "@/lib/site/seo";

export async function generateMetadata() {
  return pageMetadata({ title: "Terms", description: "Website terms for Northridge.", path: "/terms-and-conditions" });
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
      <h1 className="font-serif text-5xl">Terms and conditions</h1>
      <p className="mt-6 text-[#4a5866]">
        Published trip pages are information, not a confirmed booking. A journey is confirmed only when the CRM records a booking. Replace this placeholder with counsel-reviewed terms before public launch.
      </p>
    </main>
  );
}
