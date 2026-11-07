# Public website + CRM publishing

The marketing site and CRM share one Next.js app and one database.

- Public: `/`, `/destinations`, `/trips`, `/travel-guides`, `/enquire`, policies.
- CRM stays on existing routes (`/overview`, `/packages`, `/website`, …). Those routes are `noindex`.

## Publishing

1. Create or edit a package under `/packages`.
2. Set website status under `/website` (draft / pending approval / published / scheduled / unpublished / archived).
3. Only `content.publish` (owner, admin) can publish.
4. Public pages and `/api/public/trips` return published listings only.
5. `/p/[slug]` redirects to `/trips/[slug]`.

## Enquiries

`/enquire`, trip pages, custom trip, and contact write through `submitEnquiryAction` → `ingestLead` (same CRM leads, trip enquiries, follow-up task, audit, UTM, landing page).

## CMS

`/website/content` edits homepage copy and travel guides. Destinations are rows in `website_destinations`.

## Launch checklist

1. Apply `0005_website.sql`.
2. Set `NEXT_PUBLIC_APP_URL` to the real public host.
3. Optional: `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GSC_VERIFICATION`. Analytics scripts load only after cookie consent.
4. Replace Unsplash placeholders with licensed or owned photography.
5. Review privacy, terms, and cancellation with counsel.
6. Confirm sitemap at `/sitemap.xml` and robots at `/robots.txt`.
7. Do not enable review schema until real, permitted testimonials exist.

Analytics visitor counts are shown only when a provider is configured. First-party enquiry events appear on `/website`.
