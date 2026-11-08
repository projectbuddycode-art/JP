import Link from "next/link";
import { publicEnv } from "@/lib/public-env";
import { SITE_NAME } from "@/lib/site/defaults";
import { NewsletterForm } from "@/components/site/newsletter";
import { WhatsAppLink } from "@/components/site/whatsapp";

export { SiteHeader } from "@/components/site/header";

export function SiteFooter() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  return (
    <footer className="mt-8 border-t border-[#dce7ef] bg-white text-[#12324d]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 sm:py-16 lg:grid-cols-4">
        <div>
          <p className="font-serif text-3xl">{SITE_NAME}</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#5d6d7a]">
            A Himalayan travel desk for Spiti, Ladakh, Manali, and custom itineraries — published trips, real enquiries, one operations catalogue.
          </p>
        </div>
        <div>
          <p className="site-kicker">Destinations</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/destinations/spiti-valley">Spiti Valley</Link></li>
            <li><Link href="/destinations/ladakh">Ladakh</Link></li>
            <li><Link href="/destinations/manali">Manali</Link></li>
            <li><Link href="/destinations">All destinations</Link></li>
          </ul>
        </div>
        <div>
          <p className="site-kicker">Tour packages</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/trips">All packages</Link></li>
            <li><Link href="/group-trips">Group trips</Link></li>
            <li><Link href="/custom-trip">Plan a custom journey</Link></li>
            <li><Link href="/travel-guides">Travel stories</Link></li>
            <li><Link href="/about">About us</Link></li>
            <li><Link href="/reviews">Traveller reviews</Link></li>
          </ul>
        </div>
        <div>
          <p className="site-kicker">Talk to the desk</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/enquire">Send an enquiry</Link></li>
            {whatsapp ? (
              <li><WhatsAppLink number={whatsapp} path="/footer" /></li>
            ) : (
              <li className="text-[#8a96a3]">WhatsApp appears when a number is configured.</li>
            )}
            <li className="pt-4">
              <p className="site-kicker">Journal by email</p>
              <NewsletterForm />
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#dce7ef] px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-[#8a96a3]">
            {publicEnv().appName} · Destination photography uses licensed Unsplash imagery until studio photographs are uploaded.
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-[#5d6d7a]">
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms-and-conditions">Terms</Link>
            <Link href="/cancellation-policy">Cancellation</Link>
            <Link href="/login" className="rounded-full border border-[#dce7ef] px-3 py-1">Admin login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Breadcrumbs({ items }: { items: Array<{ href: string; label: string }> }) {
  return (
    <ol className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-[#8a96a3]">
      {items.map((item, index) => (
        <li key={item.href} className="flex items-center gap-2">
          {index > 0 ? <span>/</span> : null}
          <Link href={item.href} className="hover:text-[#12324d]">{item.label}</Link>
        </li>
      ))}
    </ol>
  );
}
