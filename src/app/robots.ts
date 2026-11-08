import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site/seo";

const privatePaths = [
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
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "Applebot-Extended"],
        allow: ["/", "/llms.txt", "/trips", "/destinations", "/travel-guides", "/about", "/enquire"],
        disallow: privatePaths,
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
