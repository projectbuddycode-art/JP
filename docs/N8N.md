# n8n as the scheduled automation engine

Vercel Hobby does not allow an every-minute (or multiple-times-per-day) cron. This project **does not** use Vercel Cron for job processing.

Vercel still serves the CRM, public website, authentication, webhooks, and authenticated tick endpoints. **n8n** fires the clocks. **Supabase** stores schedules, pending jobs, retries, idempotency keys, and history.

Incoming website, Meta, WhatsApp, and Google Ads leads are written to Postgres **before** any n8n call. If n8n is down, leads still save; scheduled work waits in `jobs`.

Timezone for all schedules: **Asia/Kolkata**.

## 1. Host n8n

Use n8n Cloud or a always-on host (VM, Railway, Render, your own server). Serverless Vercel is not an n8n host.

Create n8n environment variables:

| n8n variable | Value |
|---|---|
| `CRM_BASE_URL` | Production `NEXT_PUBLIC_APP_URL` (https, no trailing slash) |
| `CRM_CRON_SECRET` | Same string as Vercel `CRON_SECRET` |

## 2. CRM environment (Vercel, server-only)

| Variable | Purpose |
|---|---|
| `CRON_SECRET` | Bearer token for `/api/automation/tick` and `/api/cron/jobs` |
| `N8N_BASE_URL` | n8n origin, e.g. `https://n8n.example.com` |
| `N8N_API_KEY` | n8n Public API key (workflow list, activate/deactivate, executions) |
| `N8N_INGEST_WEBHOOK_URL` | Optional outbound notify after a lead is **already saved** |

Never put these in `NEXT_PUBLIC_*`.

## 3. Database

Apply `supabase/migrations/0010_n8n_schedules.sql` on the existing project. It adds `automation_schedules` and does not reset customer data.

## 4. Import workflows

JSON templates (Schedule Trigger + HTTP Request) live in `n8n/workflows/`:

1. `northridge-job-worker.json` — every 5 minutes, `process_due_jobs` (replaces Vercel `* * * * *`)
2. `northridge-followups.json` — every 15 minutes
3. `northridge-report-daily.json` — 08:00 IST daily
4. `northridge-report-weekly.json` — Monday 08:00 IST
5. `northridge-report-monthly.json` — 1st of month 08:00 IST
6. `northridge-payments.json` — 09:00 IST daily
7. `northridge-departures.json` — 09:30 IST daily
8. `northridge-documents.json` — 10:00 IST daily
9. `northridge-suppliers.json` — 10:30 IST daily
10. `northridge-social.json` — every 5 minutes, publishes due `social.publish` jobs only when Graph accepts them

In n8n: **Workflows → Import from File**. Set each workflow timezone to `Asia/Kolkata`. Activate after a manual test.

The HTTP node posts to `{CRM_BASE_URL}/api/automation/tick` with `Authorization: Bearer {CRM_CRON_SECRET}`.

## 5. Verify

1. CRM **Automation Center** → **Test n8n API**. Connected only if `/api/v1/workflows` succeeds.
2. Run a workflow once in n8n. A `401` means the secret does not match. A `503` means `CRON_SECRET` is missing on Vercel.
3. Confirm a `jobs` row moves from `pending` to `succeeded` or `failed` with a real error.
4. Do not treat an empty or skipped result as a successful Meta/WhatsApp send.

## 6. Failure behaviour

- Tick failures stay in n8n execution history and in `jobs.last_error`.
- Jobs retry with backoff until `max_attempts`.
- Overdue `automation_schedules.next_run_at` is shown in the Automation Center.
- Lead webhooks never wait on n8n.

## 7. What Vercel no longer does

Removed from `vercel.json`:

- `GET /api/cron/jobs` every minute (`* * * * *`)

The route still exists for n8n. It is not a Vercel Cron.
