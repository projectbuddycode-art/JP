import { EnquiryForm } from "@/components/site/enquiry-form";
import { pageMetadata } from "@/lib/site/seo";

export async function generateMetadata() {
  return pageMetadata({
    title: "Contact",
    description: "Enquire with the Northridge travel desk for Spiti, Manali, and Ladakh journeys.",
    path: "/contact",
  });
}

export default function ContactPage() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-36">
      <h1 className="font-serif text-5xl">Talk to the travel team</h1>
      <p className="mt-4 text-white/65">
        Use this form so the enquiry is stored, assigned, and followed up. WhatsApp is shown only when a number is configured for the workspace.
      </p>
      {whatsapp ? (
        <a className="mt-6 inline-block text-[#c4a574]" href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}>
          Open WhatsApp
        </a>
      ) : null}
      <div className="mt-10">
        <EnquiryForm landingPath="/contact" />
      </div>
    </main>
  );
}
