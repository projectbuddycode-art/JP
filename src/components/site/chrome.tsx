import Link from "next/link";
import { publicEnv } from "@/lib/public-env";
import { SITE_NAME } from "@/lib/site/defaults";
import { NewsletterForm } from "@/components/site/newsletter";
import { WhatsAppLink } from "@/components/site/whatsapp";

export { SiteHeader } from "@/components/site/header";

export function SiteFooter() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  return (
    <footer className="site-footer border-t border-white/10 bg-[#0c0f12] text-[#f4efe6]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-4">
        <div>
          <p className="font-serif text-2xl">{SITE_NAME}</p>
          <p className="mt-3 max-w-xs text-sm text-white/60">
            Himalayan journeys managed from one operations desk — Spiti, Manali, Ladakh, and custom itineraries.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Travel</p>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li><Link href="/destinations/spiti-valley">Spiti Valley</Link></li>
            <li><Link href="/destinations/manali">Manali</Link></li>
            <li><Link href="/destinations/ladakh">Ladakh</Link></li>
            <li><Link href="/trips">All trips</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">House</p>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li><Link href="/about">About</Link></li>
            <li><Link href="/travel-guides">Travel journal</Link></li>
            <li><Link href="/privacy-policy">Privacy</Link></li>
            <li><Link href="/terms-and-conditions">Terms</Link></li>
            <li><Link href="/cancellation-policy">Cancellation</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Talk to the desk</p>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/enquire">Send an enquiry</Link></li>
            {whatsapp ? (
              <li><WhatsAppLink number={whatsapp} path="/footer" /></li>
            ) : (
              <li className="text-white/40">WhatsApp number is published when configured.</li>
            )}
            <li>
              <p className="text-xs uppercase tracking-[0.16em] text-white/40">Journal by email</p>
              <NewsletterForm />
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            {publicEnv().appName} · Photography on this site uses Unsplash destination imagery until studio photographs are uploaded.
          </p>
          <Link
            href="/login"
            className="shrink-0 border border-white/25 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-white/80 hover:border-white hover:text-white"
          >
            Admin login
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function Breadcrumbs({ items }: { items: Array<{ href: string; label: string }> }) {
  return (
    <ol className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-white/50">
      {items.map((item, index) => (
        <li key={item.href} className="flex items-center gap-2">
          {index > 0 ? <span>/</span> : null}
          <Link href={item.href} className="hover:text-white">{item.label}</Link>
        </li>
      ))}
    </ol>
  );
}
