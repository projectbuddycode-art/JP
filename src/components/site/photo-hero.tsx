import type { ReactNode } from "react";

export function PhotoHero({
  image,
  kicker,
  title,
  subtitle,
  children,
}: {
  image: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <header className="relative min-h-[58vh] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#12324d]/80 via-[#12324d]/35 to-[#12324d]/10" />
      <div className="relative mx-auto flex min-h-[58vh] max-w-6xl flex-col justify-end px-6 pb-12 pt-10 text-white">
        {kicker ? <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#f4c14e]">{kicker}</p> : null}
        <h1 className="mt-3 max-w-4xl font-serif text-4xl md:text-6xl">{title}</h1>
        {subtitle ? <p className="mt-4 max-w-2xl text-lg text-white/90">{subtitle}</p> : null}
        {children}
      </div>
    </header>
  );
}
