# Acceptance checklist

Date: 2026-10-22

## Automated evidence (this workspace)

- `npm test` — 32 passed (previous CRM tests plus RBAC, assignment engine, reporting intelligence)
- `npm run lint` — pass
- `npm run typecheck` — pass
- `npm run db:validate` — pass
- `npm run build` — pass (Next.js 16.4.2 production build)

Legend: **pass** = automated or code-inspected in this repo; **pending-external** = needs live provider credentials or a provisioned Supabase project.

## CRM core

- [x] Owner can sign in/out — implemented via Supabase Auth actions (`src/app/actions/auth.ts`). **pending-external** live login until a project exists.
- [x] Protected routes redirect unauthenticated users (`src/lib/supabase/proxy.ts`).
- [x] Leads create/search/filter — UI + server actions present. **pending-external** browser QA with data.
- [x] Contacts vs leads modelled separately; duplicates match phone/email only. **pass** `duplicates.test.ts`.
- [x] Pipeline stages, packages, bookings, follow-up tasks implemented.
- [x] Activity timeline writes on create/stage/note/proposal.
- [x] Dashboard metrics query live tables (no hardcoded KPI numbers). Demo seed is labelled.

## Lead integrations

- [x] Google Ads webhook verifies key, dedupes `lead_id`, flags tests. **pass** unit tests; **pending-external** live Ads.
- [x] Meta webhook verifies HMAC and challenge token. **pass** HMAC unit test; **pending-external** Meta app.
- [x] Website form validates + rate limits. **pending-external** live submit (needs service role).
- [ ] Replay of the same provider event against a live database — **pending-external**.
- [ ] Invalid webhook rejected in a deployed environment — **pending-external**.

## WhatsApp

- [x] Eligibility, 24h window, opt-out, disconnected provider. **pass** `eligibility.test.ts`.
- [x] Inbound handler records messages and STOP suppression. **pending-external** Cloud API.
- [ ] Approved template send in production — **pending-external**.

## Social Media Studio

- [x] Draft/schedule UI and durable `jobs` row on schedule.
- [x] Publish requires provider confirmation. **pass** `validate.test.ts`.
- [x] Missing credentials fail honestly (status `failed` / pending card).
- [ ] Live IG/FB publish — **pending-external**.

## Automation Center

- [x] Create/edit/enable/disable/test (dry-run job). Owner-only writes.
- [x] Graph validation and wait self-loop rejection. **pass** `validate.test.ts`.
- [x] Disabled workflows skip execution in the engine.
- [x] Consent checked before queueing WhatsApp.
- [ ] Live retry of a failed provider side-effect — **pending-external**.

## Security and operations

- [x] RLS policies in `0002_rls.sql`; secrets table has no authenticated grants.
- [x] Owner claim is service-role + bootstrap secret/email.
- [x] OAuth state cookie validated.
- [x] Log redaction. **pass** `redact.test.ts`.
- [x] Rate limit helper present (in-memory; use Redis when scaling).
- [ ] Live RLS probe with two users — **pending-external**.
- [ ] Backup restore drill — **pending-external** (`docs/BACKUP.md`).

## Reporting and handover

- [x] KPI definitions in Settings and `src/lib/kpi.ts`.
- [x] Operating docs: README, DEPLOYMENT, INTEGRATIONS, BACKUP.
- [x] Remaining external setup listed below.

## External dependencies still required

1. Supabase project URL, anon key, service role.
2. Owner bootstrap email or secret.
3. Meta app, webhook verify token, Page token, IG professional account.
4. WhatsApp Cloud API WABA, phone number id, token (number eligibility not guaranteed).
5. Google Ads lead form webhook key.
6. Optional OpenAI, Resend, n8n, Sentry.
7. Vercel (or similar) HTTPS + cron secret.
8. Production privacy notice and DPDP review by the operator.
