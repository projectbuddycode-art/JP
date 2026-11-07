"use client";

import Link from "next/link";
import { useState } from "react";
import { SITE_NAME } from "@/lib/site/defaults";

const NAV = [
  { href: "/destinations", label: "Destinations" },
  { href: "/trips", label: "Trips" },
  { href: "/travel-guides", label: "Journal" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-serif text-2xl tracking-tight text-white">
          {SITE_NAME}
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-white/80 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/custom-trip" className="hidden text-sm text-white/80 hover:text-white sm:inline">
            Custom trip
          </Link>
          <Link href="/enquire" className="border border-white/40 px-4 py-2 text-sm text-white hover:bg-white hover:text-black">
            Enquire
          </Link>
          <button
            type="button"
            className="border border-white/30 px-3 py-2 text-xs uppercase tracking-widest text-white md:hidden"
            aria-expanded={open}
            aria-label="Open menu"
            onClick={() => setOpen((value) => !value)}
          >
            Menu
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-white/10 bg-black/90 px-6 py-4 md:hidden">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="block py-2 text-sm text-white" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link href="/custom-trip" className="block py-2 text-sm text-white" onClick={() => setOpen(false)}>
            Custom trip
          </Link>
        </div>
      ) : null}
    </header>
  );
}
