# Implementation report

This release is an audit of the existing Next.js 16 App Router + Supabase CRM, not a rewrite.

## Architecture (as implemented)

- **Public website:** `src/app/(marketing)` — destinations, trips, enquire, guides, policies.
- **CRM:** `src/app/(workspace)` — operations nav + business management nav.
- **Auth:** Supabase Auth or labelled demo mode when Supabase env is absent.
- **Ingest:** `src/lib/ingest/engine.ts` — single lead writer for website, Meta, WhatsApp, Google Ads, email, LinkedIn, TikTok, CSV, custom webhook, manual.
- **Jobs:** Postgres `jobs` table. n8n calls `POST /api/automation/tick` with `CRON_SECRET`. Vercel does not run a minute cron.
- **Publishing:** Package `website_status`; public catalog filters `isPubliclyListed`.

## Work in this pass

- Hobby-compatible `vercel.json` (no crons).
- n8n workflow templates and schedule table (`0010`).
- Release hardening migration (`0011`).
- IST report boundaries.
- Expanded robots/noindex.
- Durable rate limiting.
- Audit documentation set.

## Intentionally not rebuilt

WhatsApp inbox, social composer, pipeline, bookings, departures, website aesthetic, ingest adapters.
