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
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
      <p className="site-kicker">Contact</p>
      <h1 className="mt-4 font-serif text-5xl md:text-6xl">Talk to the travel team</h1>
      <p className="mt-4 text-[#5c6b7a]">
        Use this form so the enquiry is stored, assigned, and followed up. WhatsApp is shown only when a number is configured for the workspace.
      </p>
      {whatsapp ? (
        <a className="mt-6 inline-block text-[#3d7ab5]" href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}>
          Open WhatsApp
        </a>
      ) : null}
      <div className="mt-10">
        <EnquiryForm landingPath="/contact" />
      </div>
    </main>
  );
}
