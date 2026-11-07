import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/overview",
          "/leads",
          "/pipeline",
          "/login",
          "/setup",
          "/forgot-password",
          "/team",
          "/audit",
          "/website",
          "/settings",
          "/sales",
          "/bookings",
          "/contacts",
          "/packages",
          "/inbox",
          "/social",
          "/campaigns",
          "/automation",
          "/integrations",
          "/departures",
          "/travellers",
          "/operations",
          "/partners",
          "/reports",
          "/approvals",
          "/proposal/",
          "/api/",
        ],
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
