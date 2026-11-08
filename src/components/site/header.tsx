"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SITE_NAME } from "@/lib/site/defaults";
import { WhatsAppLink } from "@/components/site/whatsapp";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/trips", label: "Tour Packages" },
  { href: "/group-trips", label: "Group Trips" },
  { href: "/destinations", label: "Destinations" },
  { href: "/travel-guides", label: "Travel Stories" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="site-header is-sticky sticky top-0 z-40 w-full bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-[#12324d]">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2f9ed8] text-white shadow-[0_8px_18px_rgba(47,158,216,0.35)]">
            <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
              <path fill="currentColor" d="M4 24 12.2 10l4.3 7.2L20.2 12 28 24H4Zm8.2-8.4L8.6 22h14.8l-3.2-5.3-3.7 5.1-4.3-6.2Z" />
            </svg>
          </span>
          <span>
            <span className="block font-serif text-2xl leading-none tracking-tight">{SITE_NAME}</span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2f9ed8]">Spiti · Ladakh · Manali</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-5 text-[13px] font-medium text-[#5d6d7a] lg:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-[#12324d]">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {whatsapp ? (
            <span className="hidden rounded-full border border-[#dce7ef] px-3 py-2 text-sm text-[#2f8f6b] sm:inline-flex">
              <WhatsAppLink number={whatsapp} path="/header" />
            </span>
          ) : null}
          <Link href="/custom-trip" className="site-btn-gold hidden sm:inline-flex">
            Plan Your Trip
          </Link>
          <button
            type="button"
            className="rounded-full border border-[#dce7ef] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#12324d] lg:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-white px-8 py-8 lg:hidden">
          <div className="flex items-center justify-between">
            <span className="font-serif text-2xl">{SITE_NAME}</span>
            <button type="button" className="text-sm font-semibold uppercase tracking-[0.16em]" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <nav className="mt-10 flex flex-col gap-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-serif text-4xl text-[#12324d]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/custom-trip" className="site-btn-gold mt-auto w-fit" onClick={() => setOpen(false)}>
            Plan Your Trip
          </Link>
        </div>
      ) : null}
    </header>
  );
}
