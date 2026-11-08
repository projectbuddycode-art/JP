import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { ConsentAnalytics } from "@/components/site/consent-analytics";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site min-h-screen bg-[#f4f8fb] text-[#12324d]">
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
