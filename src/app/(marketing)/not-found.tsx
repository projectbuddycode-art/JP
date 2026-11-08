import Link from "next/link";

export default function MarketingNotFound() {
  return (
    <main className="mx-auto max-w-xl px-6 py-40 text-center">
      <p className="site-kicker">404</p>
      <h1 className="mt-4 font-serif text-5xl">This page is not published.</h1>
      <p className="mt-4 text-[#5c6b7a]">It may be a draft, an unpublished trip, or an address that does not exist.</p>
      <Link href="/trips" className="site-btn-gold mt-8">
        Explore trips
      </Link>
    </main>
  );
}
