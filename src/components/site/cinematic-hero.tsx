"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

const GhostFibers = dynamic(() => import("@/components/site/ghost-fibers/GhostFibers"), {
  ssr: false,
  loading: () => <div className="ghost-fibers-fallback absolute inset-0" />,
});

export function CinematicHero({
  heading,
  subheading,
  supporting,
  image,
  primaryHref = "/trips",
  primaryLabel = "Explore trips",
  secondaryHref = "/custom-trip",
  secondaryLabel = "Plan your trip",
  destinations = [],
}: {
  heading: string;
  subheading?: string;
  supporting?: string;
  image: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  destinations?: Array<{ slug: string; name: string }>;
}) {
  const [mobile, setMobile] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 768px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setMobile(narrow.matches);
      setReduce(motion.matches);
    };
    sync();
    setMounted(true);
    narrow.addEventListener("change", sync);
    motion.addEventListener("change", sync);
    return () => {
      narrow.removeEventListener("change", sync);
      motion.removeEventListener("change", sync);
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#e8f4fb] px-4 pb-10 pt-6 sm:px-6 md:pb-12 md:pt-10">
      <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <div className="min-w-0">
          <p className="site-kicker">Spiti · Ladakh · Manali</p>
          <h1 className="mt-3 max-w-xl font-serif text-[2.15rem] leading-[1.08] tracking-tight text-[#12324d] sm:text-5xl md:text-6xl">
            {heading}
          </h1>
          {subheading ? <p className="mt-4 max-w-xl text-base leading-relaxed text-[#3d5364] sm:text-lg">{subheading}</p> : null}
          {supporting ? <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5d6d7a]">{supporting}</p> : null}
          <div className="site-cta-row mt-7">
            <Link href={primaryHref} className="site-btn-gold">{primaryLabel}</Link>
            <Link href={secondaryHref} className="site-btn-ghost">{secondaryLabel}</Link>
          </div>
          <form action="/trips" className="mt-7 rounded-3xl bg-white p-3 shadow-[0_18px_40px_rgba(18,50,77,0.08)]">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
              <label className="sr-only" htmlFor="hero-dest">Destination</label>
              <select id="hero-dest" name="destination" className="site-input min-w-0">
                <option value="">All destinations</option>
                {destinations.map((item) => (
                  <option key={item.slug} value={item.name}>{item.name}</option>
                ))}
              </select>
              <label className="sr-only" htmlFor="hero-q">Search trips</label>
              <input id="hero-q" name="q" placeholder="Search a journey" className="site-input min-w-0" />
              <button className="site-btn-gold w-full sm:col-span-2 xl:col-span-1 xl:w-auto" type="submit">
                Find trips
              </button>
            </div>
          </form>
        </div>
        <div className="relative h-[220px] overflow-hidden rounded-[1.5rem] shadow-[0_24px_60px_rgba(18,50,77,0.16)] sm:h-[320px] md:h-[420px] lg:h-[520px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Himalayan landscape" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 mix-blend-soft-light opacity-70">
            {!mounted || reduce ? (
              <div className="ghost-fibers-fallback absolute inset-0" />
            ) : (
              <GhostFibers
                glowColor="#2f9ed8"
                lineColor="#12324d"
                secondaryColor="#f4c14e"
                gradient="depth"
                layers={mobile ? 2 : 3}
                twist={1.15}
                threads={mobile ? 32 : 64}
                fiberStyle="dots"
                depthOfField={0.8}
                hoverEffect="focus"
                intro
                lightMode
                mouseInteraction={!mobile}
                density={mobile ? 0.45 : 0.75}
                particles={mobile ? 0.16 : 0.32}
                brightness={1.08}
                vignette={0.12}
                dpr={mobile ? 1 : undefined}
              />
            )}
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#12324d]/55 to-transparent p-4 text-white sm:p-6">
            <p className="text-sm font-medium">Colourful Himalayan journeys, planned from one desk.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
