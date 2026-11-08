"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SITE_NAME } from "@/lib/site/defaults";

const NAV = [
  { href: "/destinations", label: "Destinations" },
  { href: "/trips", label: "Journeys" },
  { href: "/about", label: "Our story" },
  { href: "/travel-guides", label: "Travel journal" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={`site-header ${scrolled ? "is-sticky" : ""}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-serif text-2xl tracking-tight text-[#f4efe6]">
          {SITE_NAME}
        </Link>
        <nav className="hidden items-center gap-8 text-[13px] tracking-[0.04em] text-white/75 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/custom-trip" className="site-btn-gold hidden sm:inline-flex">
            Plan your trip
          </Link>
          <button
            type="button"
            className="border border-white/25 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#07090b] px-8 py-10 md:hidden">
          <div className="flex items-center justify-between">
            <span className="font-serif text-2xl">{SITE_NAME}</span>
            <button type="button" className="text-sm uppercase tracking-[0.2em]" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <nav className="mt-16 flex flex-col gap-5">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-serif text-4xl text-[#f4efe6]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/custom-trip" className="site-btn-gold mt-auto w-fit" onClick={() => setOpen(false)}>
            Plan your trip
          </Link>
        </div>
      ) : null}
    </header>
  );
}
