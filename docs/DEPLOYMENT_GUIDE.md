# Deployment guide

See also `docs/DEPLOYMENT.md` and `docs/N8N.md`.

## Vercel (Hobby-compatible)

1. Import GitHub repo `projectbuddycode-art/JP`.
2. Framework: Next.js. Build: `npm run build`.
3. Set environment variables from `docs/ENVIRONMENT_VARIABLES.md`.
4. Confirm `vercel.json` has **no** `crons` (Hobby forbids every-minute jobs). `npm run hobby:check` must pass.
5. Immediate webhooks stay on Vercel (`/api/webhooks/*`).
6. Scheduled work: n8n → `POST {APP_URL}/api/automation/tick`.

## Supabase

Run migrations `0001` through `0011` in order on the existing database. Do not reset.

## n8n

Host n8n separately. Import `n8n/workflows/*.json`. Set `CRM_BASE_URL` and `CRM_CRON_SECRET`. Activate after a manual execution returns 200.

## Health

`GET /api/health` reports `supabaseConfigured` and `n8nConfigured` (configured ≠ connected).
