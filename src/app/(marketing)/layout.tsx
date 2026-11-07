import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { ConsentAnalytics } from "@/components/site/consent-analytics";
import { isDemoAuthMode } from "@/lib/auth/demo-session";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const demo = isDemoAuthMode();
  return (
    <div className="site min-h-screen bg-[#0c0f12] text-[#f4efe6]">
      {demo ? (
        <p className="bg-amber-100 px-4 py-2 text-center text-xs text-[#111]">
          DEMO MODE — sample catalogue from the isolated demonstration store. Not the production website database.
        </p>
      ) : null}
      <SiteHeader />
      {children}
      <SiteFooter />
      <ConsentAnalytics
        ga4={process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID}
        pixel={process.env.NEXT_PUBLIC_META_PIXEL_ID}
      />
    </div>
  );
}
