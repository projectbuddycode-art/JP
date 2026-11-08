import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { ConsentAnalytics } from "@/components/site/consent-analytics";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site min-h-screen bg-[#0c0f12] text-[#f4efe6]">
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
