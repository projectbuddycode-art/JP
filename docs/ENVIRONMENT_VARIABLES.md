# Environment variables

Never commit real values. Only `NEXT_PUBLIC_*` reach the browser.

## Required for production CRM + website

| Name | Server only | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | no | Canonical site URL |
| `NEXT_PUBLIC_APP_NAME` | no | Display name |
| `NEXT_PUBLIC_SUPABASE_URL` | no | Supabase API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | Auth + RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Ingest, jobs, admin |
| `CRON_SECRET` | yes | n8n tick + job worker |
| `OWNER_BOOTSTRAP_EMAIL` or `OWNER_BOOTSTRAP_SECRET` | yes | First owner |
| `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` | yes | Optional one-time setup; remove after use |

## Scheduling (n8n)

| Name | Purpose |
|---|---|
| `N8N_BASE_URL` | Public API origin |
| `N8N_API_KEY` | List/activate workflows |
| `N8N_INGEST_WEBHOOK_URL` | Optional post-ingest notify |

On n8n: `CRM_BASE_URL`, `CRM_CRON_SECRET` (= `CRON_SECRET`).

## Optional providers

`META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `GOOGLE_ADS_WEBHOOK_KEY`, `LINKEDIN_*`, `TIKTOK_*`, `INGEST_WEBHOOK_SECRET`, `RESEND_*`, `OPENAI_*`, `SENTRY_DSN`.

## Optional public analytics (after consent)

`NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GSC_VERIFICATION`.

## Demo-only (local without Supabase)

`DEMO_LOGIN_EMAIL`, `DEMO_LOGIN_PASSWORD`, `DEMO_SESSION_SECRET`.
