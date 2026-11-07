# Integrations and unified lead ingestion

All channels write into one CRM lead-ingestion engine (`src/lib/ingest/engine.ts`). Provider adapters never create a second lead table.

Webhook base URL: `{NEXT_PUBLIC_APP_URL}`

## Honest status

A provider is **Connected** only after the required credentials exist and a live test or verified event succeeds. LinkedIn stays **Awaiting Approval** until Lead Sync access exists. Tokens are never returned to the browser.

## Apply database changes

Run additive migrations `0008_ingest.sql` (and earlier files) against the existing Supabase project. Do not reset data.

## Environment (server-only unless `NEXT_PUBLIC_`)

See `.env.example`. Vercel: set the same keys on Production/Preview. Cron: `CRON_SECRET` for `/api/cron/jobs`.

## Provider matrix

Each Integrations card has a setup guide at `/integrations/{provider-id}` covering captures, limitations, account type, permissions, webhook path, test method and recovery.

| Provider | Webhook | Connected when |
|---|---|---|
| Website forms | n/a (server action) | Enquiry submits successfully |
| Meta Lead Ads | `/api/webhooks/meta` | Signed webhook + retrieved fields or Graph test |
| Instagram messaging | `/api/webhooks/meta` | Messaging subscription + enquiry stored |
| Instagram/Facebook publishing | n/a | Graph token test succeeds |
| WhatsApp Cloud API | `/api/webhooks/whatsapp` | Number lookup succeeds |
| Google Ads lead forms | `/api/webhooks/google-ads` | Valid `google_key` **and** a processed lead |
| LinkedIn Lead Gen | `/api/webhooks/linkedin` | Lead Sync approval + retrieved lead |
| TikTok Lead Gen | `/api/webhooks/tiktok` | App secret + processed lead |
| Google Business | n/a | Tracking links / manual call source |
| Email | `/api/webhooks/email` | Signed inbound payload |
| Custom API | `/api/webhooks/custom` | `INGEST_WEBHOOK_SECRET` |
| CSV | CRM import | Authorized user import |
| n8n | optional outbound | `N8N_BASE_URL` + API key succeed |

## Custom webhook body

`POST /api/webhooks/custom` with `Authorization: Bearer $INGEST_WEBHOOK_SECRET` and JSON matching the normalized event (`event_id`, `contact`, optional `trip`, `attribution`).

## n8n

CRM remains source of truth. Optional `N8N_INGEST_WEBHOOK_URL` receives `{ leadId, provider, source_type }` after ingest. The Automation Center lists/pauses remote workflows via the n8n Public API. The editor is not embedded.

## Deployment

1. Apply migrations.
2. Set env on Vercel.
3. Point provider dashboards at the production webhook URLs.
4. Verify website enquiry, then each configured provider.
5. Mark unconfigured providers **BLOCKED**, not passed.
