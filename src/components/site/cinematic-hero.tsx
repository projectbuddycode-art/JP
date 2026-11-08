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
  primaryLabel = "Explore journeys",
  secondaryHref = "/custom-trip",
  secondaryLabel = "Design your journey",
}: {
  heading: string;
  subheading?: string;
  supporting?: string;
  image: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  const [mobile, setMobile] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 768px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setMobile(narrow.matches);
      setReduce(motion.matches);
    };
    sync();
    narrow.addEventListener("change", sync);
    motion.addEventListener("change", sync);
    return () => {
      narrow.removeEventListener("change", sync);
      motion.removeEventListener("change", sync);
    };
  }, []);

  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden">
      <div className="absolute inset-0 bg-[#07090b]" />
      <div className="absolute inset-0">
        {reduce ? (
          <div className="ghost-fibers-fallback absolute inset-0" />
        ) : (
          <GhostFibers
            glowColor="#c4a574"
            lineColor="#f4efe6"
            secondaryColor="#5b7a6e"
            gradient="depth"
            layers={mobile ? 2 : 3}
            twist={1.2}
            threads={mobile ? 36 : 72}
            fiberStyle="dots"
            depthOfField={0.85}
            hoverEffect="focus"
            intro
            mouseInteraction={!mobile}
            density={mobile ? 0.5 : 0.85}
            particles={mobile ? 0.18 : 0.4}
            brightness={1.05}
            vignette={0.42}
            dpr={mobile ? 1 : undefined}
          />
        )}
      </div>
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.28] mix-blend-soft-light"
        style={{ backgroundImage: `url(${image})` }}
        role="img"
        aria-label="Himalayan landscape"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07090b] via-[#07090b]/35 to-transparent" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 pt-36">
        <p className="text-[11px] uppercase tracking-[0.42em] text-[#c4a574]">Spiti · Ladakh · Himachal</p>
        <h1 className="mt-6 max-w-4xl font-serif text-5xl leading-[0.95] tracking-tight text-[#f4efe6] md:text-7xl lg:text-[5.6rem]">
          {heading}
        </h1>
        {subheading ? (
          <p className="mt-6 max-w-xl font-serif text-2xl text-[#f4efe6]/80 md:text-3xl">{subheading}</p>
        ) : null}
        {supporting ? <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70">{supporting}</p> : null}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href={primaryHref} className="site-btn-gold">
            {primaryLabel}
          </Link>
          <Link href={secondaryHref} className="site-btn-ghost">
            {secondaryLabel}
          </Link>
        </div>
        <a href="#discover" className="mt-16 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/55">
          <span className="site-scroll-line" aria-hidden />
          Scroll
        </a>
      </div>
    </section>
  );
}
