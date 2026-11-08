"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SITE_NAME } from "@/lib/site/defaults";
import { WhatsAppLink } from "@/components/site/whatsapp";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/trips", label: "Packages" },
  { href: "/group-trips", label: "Group trips" },
  { href: "/destinations", label: "Destinations" },
  { href: "/travel-guides", label: "Stories" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    document.body.classList.toggle("site-menu-open", open);
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("site-menu-open");
    };
  }, [open]);

  return (
    <>
    <header className="site-header is-sticky sticky top-0 z-50 w-full bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 text-[#12324d]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#2f9ed8] text-white shadow-[0_8px_18px_rgba(47,158,216,0.35)] sm:h-10 sm:w-10">
            <svg viewBox="0 0 32 32" className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden>
              <path fill="currentColor" d="M4 24 12.2 10l4.3 7.2L20.2 12 28 24H4Zm8.2-8.4L8.6 22h14.8l-3.2-5.3-3.7 5.1-4.3-6.2Z" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block truncate font-serif text-xl leading-none tracking-tight sm:text-2xl">{SITE_NAME}</span>
            <span className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2f9ed8] sm:block">
              Spiti · Ladakh · Manali
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-4 text-[13px] font-medium text-[#5d6d7a] xl:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap transition hover:text-[#12324d]">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {whatsapp ? (
            <span className="hidden rounded-full border border-[#dce7ef] px-3 py-2 text-sm text-[#2f8f6b] xl:inline-flex">
              <WhatsAppLink number={whatsapp} path="/header" />
            </span>
          ) : null}
          <span className="hidden xl:inline-flex">
            <Link href="/custom-trip" className="site-btn-gold">
              Plan your trip
            </Link>
          </span>
          <button
            type="button"
            className="rounded-full border border-[#dce7ef] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#12324d] xl:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
    </header>
      {open ? (
        <div
          className="fixed inset-0 z-[80] flex flex-col bg-white px-6 pb-8 xl:hidden"
          style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))", paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center justify-between gap-4">
            <span className="font-serif text-2xl">{SITE_NAME}</span>
            <button type="button" className="rounded-full border border-[#dce7ef] px-3 py-2 text-sm font-semibold uppercase tracking-[0.16em]" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl px-2 py-3 font-serif text-3xl leading-tight text-[#12324d] sm:text-4xl"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/custom-trip" className="site-btn-gold mt-6 w-full" onClick={() => setOpen(false)}>
            Plan your trip
          </Link>
        </div>
      ) : null}
    </>
  );
}
