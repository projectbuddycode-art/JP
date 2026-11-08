"use client";

import Link from "next/link";

export function StickyEnquiryBar({ href, label }: { href: string; label: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#dce7ef] bg-white/95 p-3 backdrop-blur lg:hidden">
      <Link href={href} className="site-btn-gold flex w-full justify-center">
        {label}
      </Link>
    </div>
  );
}
