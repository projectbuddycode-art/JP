# Deployment

## Environment

Set every variable from `.env.example` on the host. Server-only keys:

- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `OWNER_BOOTSTRAP_SECRET` and/or `OWNER_BOOTSTRAP_EMAIL`
- `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` (server-only, one-time initial owner; never commit real values)
- Meta, WhatsApp, Google Ads, OpenAI, Resend, n8n secrets

Never expose service-role, OAuth client secrets, or provider tokens to the browser. Only `NEXT_PUBLIC_*` values are public.

## Supabase

1. Apply `supabase/migrations/0001_init.sql`, `0002_rls.sql`, then additive `0003_partner_intelligence.sql` and `0004_rls_v2.sql`. Do not reset production data.
2. Confirm RLS is enabled (the migration does this).
3. Do not apply `supabase/seed.sql` in production.
4. Create storage buckets later for package and social media if you enable uploads (`package-media`, `social-media`). Keep social media private.

## App host (Vercel or equivalent)

1. Connect the repository.
2. Build command: `npm run build`
3. Set env vars.
4. Confirm HTTPS.
5. Do **not** add a Vercel Cron on the Hobby plan for job processing. Import n8n workflows from `n8n/workflows/` (see `docs/N8N.md`). n8n calls `POST /api/automation/tick` with `Authorization: Bearer $CRON_SECRET`. `vercel.json` must stay Hobby-compatible (`npm run hobby:check`).
6. Health check: `GET /api/health`.
7. OAuth and Meta webhook URLs must use the production `NEXT_PUBLIC_APP_URL`, never localhost.

## Initial owner bootstrap

1. Set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` in the host environment. Do not commit them.
2. Open `/setup` and choose **Create initial owner from server env**. The password is read only on the server and stored by Supabase Auth (hashed).
3. Sign in, then change the temporary password under Settings.
4. Bootstrap is idempotent and locks `bootstrap_state` after success. Removing the env vars afterwards is recommended.
5. Alternate path: sign in as `OWNER_BOOTSTRAP_EMAIL` and claim with `OWNER_BOOTSTRAP_SECRET`. Arbitrary users cannot become owner.

## Rollback

SQL migrations are additive. To roll back, restore a Postgres backup taken before the migration (see `docs/BACKUP.md`). Application rollback is a previous deployment.

## Error monitoring

Set `SENTRY_DSN` when you add a Sentry SDK. Until then, structured JSON logs are emitted by `src/lib/logger.ts` with redaction.

## Privacy (India)

This product stores contact and enquiry data. The operator should publish a privacy notice, honour deletion/export requests (via CRM records and Supabase), keep consent/opt-out, and execute a DPDP-aligned vendor review. Shipping this checklist does not constitute legal compliance.
