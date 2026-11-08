import { pageMetadata } from "@/lib/site/seo";

export async function generateMetadata() {
  return pageMetadata({ title: "Cancellation policy", description: "Cancellation notes published with trips.", path: "/cancellation-policy" });
}

export default function CancellationPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
      <h1 className="font-serif text-5xl">Cancellation policy</h1>
      <p className="mt-6 text-[#4a5866]">
        Package-specific cancellation text is stored on each trip. This page is the general statement: cancellations and refunds are recorded in the CRM and may require approval. Do not treat website copy as a guarantee until the owner publishes a final policy.
      </p>
    </main>
  );
}
