import { notFound } from "next/navigation";
import Link from "next/link";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { getPackageBySlug, getPublishedPackage, publicPackageDto } from "@/lib/site/catalog";
import { isPubliclyListed } from "@/lib/site/visibility";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { DESTINATION_COVERS } from "@/lib/site/defaults";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site/seo";
import { formatCurrency } from "@/lib/utils";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pack = await getPublishedPackage(slug);
  if (!pack) return pageMetadata({ title: "Trip", description: "Trip listing", path: `/trips/${slug}`, index: false });
  const dto = publicPackageDto(pack);
  return pageMetadata({
    title: dto.seo_title || pack.name,
    description: dto.seo_description || pack.short_description || pack.name,
    path: `/trips/${slug}`,
    image: dto.cover_image_url,
  });
}

export default async function TripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const preview = (await searchParams).preview === "1";
  let pack = await getPublishedPackage(slug);
  if (!pack && preview) {
    const { profile } = await getSessionUser();
    if (profile && can(profile, "content.publish")) {
      pack = await getPackageBySlug(slug);
    }
  }
  if (!pack) notFound();
  const dto = publicPackageDto(pack);
  const cover =
    dto.cover_image_url ||
    DESTINATION_COVERS[pack.destination.toLowerCase().replace(/\s+/g, "-")] ||
    DESTINATION_COVERS["spiti-valley"];
  const itinerary = Array.isArray(pack.itinerary) ? pack.itinerary : [];
  const faqs = Array.isArray(pack.faqs) ? pack.faqs : [];
  const price =
    dto.price_per_person == null
      ? "Price on request"
      : dto.price_visibility === "fixed"
        ? formatCurrency(dto.price_per_person, dto.currency)
        : `From ${formatCurrency(dto.price_per_person, dto.currency)}`;
  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Trips", path: "/trips" },
              { name: pack.name, path: `/trips/${slug}` },
            ]),
          ),
        }}
      />
      {preview && !isPubliclyListed(pack) ? (
        <p className="relative z-20 bg-[#c4a574] px-6 py-2 text-center text-sm text-[#111]">Staff preview — this trip is not public.</p>
      ) : null}
      <header className="relative min-h-[70vh] bg-cover bg-center" style={{ backgroundImage: `url(${cover})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-end px-6 pb-16 pt-32">
          <p className="text-xs uppercase tracking-[0.22em] text-[#c4a574]">{pack.destination}</p>
          <h1 className="mt-3 font-serif text-5xl md:text-6xl">{pack.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">{pack.short_description}</p>
          <p className="mt-6 text-white/80">
            {pack.duration_days ? `${pack.duration_days} days` : "Duration on request"} · {price}
            {pack.trip_type ? ` · ${pack.trip_type}` : ""}
          </p>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          {pack.long_description ? <p className="whitespace-pre-wrap text-lg text-white/75">{pack.long_description}</p> : null}
          {itinerary.length ? (
            <section className="mt-12">
              <h2 className="font-serif text-3xl">Itinerary</h2>
              <ol className="mt-6 space-y-4">
                {itinerary.map((day, index) => (
                  <li key={index} className="border-t border-white/10 pt-4">
                    <p className="text-sm text-[#c4a574]">Day {typeof day === "object" && day && "day" in day ? String((day as { day: string }).day) : index + 1}</p>
                    <p className="mt-1 text-white/80">{typeof day === "string" ? day : JSON.stringify(day)}</p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          <section className="mt-12 grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="font-serif text-2xl">Inclusions</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-white/70">{pack.inclusions || "Shared after conversation."}</p>
            </div>
            <div>
              <h2 className="font-serif text-2xl">Exclusions</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-white/70">{pack.exclusions || "Shared after conversation."}</p>
            </div>
          </section>
          {faqs.length ? (
            <section className="mt-12">
              <h2 className="font-serif text-2xl">Questions we publish</h2>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                {faqs.map((faq, index) => (
                  <li key={index}>{typeof faq === "string" ? faq : JSON.stringify(faq)}</li>
                ))}
              </ul>
            </section>
          ) : null}
          <p className="mt-10 text-sm text-white/45">
            This page is not a booking confirmation. Permits, roads, and live availability are confirmed by the travel desk after your enquiry.
          </p>
        </div>
        <aside className="h-fit border border-white/10 p-6">
          <h2 className="font-serif text-3xl">Enquire about this trip</h2>
          <EnquiryForm destination={pack.destination} packageId={pack.id} tripName={pack.name} landingPath={`/trips/${slug}`} />
          <Link href="/trips" className="mt-6 inline-block text-sm text-[#c4a574]">All published trips</Link>
        </aside>
      </div>
    </article>
  );
}
