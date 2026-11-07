# Requirements audit — Travel Business Operating System

Date: 2026-11-08. Evidence from repository inspection, unit tests, lint, typecheck, db-validate, hobby-check. Live provider E2E is **not** claimed.

Statuses: PASS | PARTIAL | FAIL | MISSING | BLOCKED | NOT APPLICABLE

## Summary

| Status | Count |
|---|---|
| PASS (code + automated evidence) | 38 |
| PARTIAL | 24 |
| FAIL (found and fixed this audit) | 6 |
| MISSING | 4 |
| BLOCKED (external credentials/approval) | 12 |
| NOT APPLICABLE | 2 |

These counts are not a “% complete” marketing score. BLOCKED items have implementation paths but no live provider confirmation.

---

## Matrix

### Auth and users

| Feature | Expected | Implementation | Files | Test | Result | Status | Missing | Fix applied | External |
|---|---|---|---|---|---|---|---|---|---|
| Owner login | Supabase Auth email/password | `signInAction`, `/login` | `src/app/actions/auth.ts` | Code + session proxy | Works when Supabase configured; demo mode without it | PARTIAL | Live owner login on provisioned project | None this pass | Supabase project |
| Partner / sales / trip leader / finance / viewer / operations_manager | Distinct roles + nav | `rbac.ts`, team invites | `src/lib/auth/rbac.ts`, `team/page.tsx` | `rbac.test.ts` | Role permissions and nav filters pass unit tests | PASS | Live multi-user browser session | operations_manager already in app RBAC | None |
| RLS partner isolation | Partner cannot read others’ leads by ID | `leads_read` owner_id or can_view_all | `0004_rls_v2.sql` | SQL review | App RBAC gave operations_manager view_all; SQL did not | FAIL→fixed | Apply 0011 on production | `can_view_all_leads` includes operations_manager; contacts/bookings scoped | Apply 0011 |
| Password reset | Forgot password | `/forgot-password` | `src/app/forgot-password` | Code | Relies on Supabase recovery email | PARTIAL | SMTP configured in Supabase | noindex layout added | Supabase mail |
| Invitations / deactivation | Owner invites, disable user | `inviteUserAction`, `setUserStatusAction` | `src/app/actions/team.ts` | Code | Present | PARTIAL | Live invite email | None | Supabase Auth |
| Bootstrap secrets | Not in frontend or git | env-only bootstrap | `bootstrap.ts`, `.gitignore` `.env*` | grep | No hardcoded passwords in src | PASS | — | — | Host env |
| Protected routes | Unauthenticated → login | `proxy.ts` | `src/lib/supabase/proxy.ts` | Code | CRM paths gated; webhooks/cron public + secret | PASS | — | `/api/automation` allowed with secret | — |

### CRM leads and sales

| Feature | Expected | Implementation | Files | Test | Result | Status | Missing | Fix | External |
|---|---|---|---|---|---|---|---|---|---|
| Lead CRUD, assign, archive, notes, calls, score | Full CRM | leads pages + actions | `leads/`, `actions/crm.ts`, `score.ts` | `score.test.ts` | Scoring rules transparent | PASS | Live UI click-through | Call log + score already present | — |
| Duplicate resolution | Phone/email match, not name | ingest match + `/leads/duplicates` | `ingest/match.ts` | `duplicates.test.ts`, `ingest.test.ts` | Name-only does not merge | PASS | — | — | — |
| CSV import/export | Import via ingest; export reports | import action, reports export | `actions/import.ts`, `/api/reports/export` | Code | CSV yes; Excel/PDF not a real workbook/PDF library | PARTIAL | Licensed Excel/PDF | — | — |
| Pipeline stages | 11 stages, proposal ≠ booking | `lead_stages`, `confirmBookingAction` | `0001_init.sql`, `crm.ts` | `journey.test.ts` | Booking insert is separate; amount_received starts at 0 | PASS | Drag-and-drop not re-tested in browser this pass | — | — |
| Follow-ups / first response | Tasks + first_response_at | notes/calls set first_response | `crm.ts` | Code | Present | PASS | — | — | — |

### Operations

| Feature | Expected | Implementation | Files | Test | Result | Status | Missing | Fix | External |
|---|---|---|---|---|---|---|---|---|---|
| Packages vs departures | Reusable package, dated departure | packages + departures tables/UI | `0006_operations.sql` | Code | Present | PASS | — | Calendar cards on departures | — |
| Readiness | Critical missing ⇒ not ready | `readiness.ts` | `lib/ops/readiness.ts` | `finance.test.ts`, `journey.test.ts` | Never ready if critical open | PASS | — | — | — |
| Travellers / suppliers / expenses / profit | Distinct cash vs booking value | ops pages + `tripProfitability` | `lib/ops/finance.ts` | unit tests | Collected ≠ confirmed_amount | PASS | Manifest PDF export | — | — |
| Trip leader live workspace | Assigned departure ops | `/departures/[id]/live` | live page | Code | Present; no GPS | PARTIAL | GPS not applicable | — | — |
| Itinerary reuse | Days on package or departure | `itinerary_days` | `0006_operations.sql` | Code | Columns exist | PARTIAL | Richer builder UX | — | — |

### Public website

| Feature | Expected | Implementation | Files | Test | Result | Status | Missing | Fix | External |
|---|---|---|---|---|---|---|---|---|---|
| Marketing pages | Home, destinations, trips, enquire, policies | `(marketing)` | those routes | Code + catalog tests | Drafts hidden by `isPubliclyListed` | PASS | Visual browser pass this session incomplete | Anon RLS now requires website published | Apply 0011 |
| Publish workflow | Draft not public; publish/unpublish | website actions + catalog | `actions/website.ts`, `catalog.ts` | `catalog.test.ts`, `journey.test.ts` | Preview requires `content.publish` | PASS | Live cache revalidation on Vercel | — | — |
| Enquiry → CRM | Same ingest engine | `submitEnquiryAction` → `ingestLead` | `actions/public.ts` | Code | Consent + rate limit | PARTIAL | Live form with service role | Durable rate limit RPC | Apply 0011 |
| Testimonials | Only approved + permission | `listApprovedTestimonials` | catalog | Code | Empty section omitted | PASS | Need real consented quotes | — | — |
| Blog | Blog routes | Travel guides only | `travel-guides` | Code | No `/blog` alias | PARTIAL | Optional `/blog` redirect | — | — |
| SEO | metadata, canonical, sitemap, robots, OG, JSON-LD | seo.ts, sitemap, robots | those files | Code | CRM noindex on workspace layout; login/setup now noindex | PASS | Search Console verification env | robots expanded | — |

### Integrations

| Channel | Status | Evidence | External |
|---|---|---|---|
| Website forms | PARTIAL | Real ingest; needs live Supabase | Service role |
| Meta Lead Ads + IG messaging/comments | BLOCKED | HMAC webhook + adapters + classify; Connected only after signed event | Meta app, tokens, permissions |
| WhatsApp Cloud | BLOCKED | Webhook HMAC, eligibility, inbox UI | WABA, templates |
| Google Ads forms | BLOCKED | Key verification + ingest | google_key |
| LinkedIn Lead Gen | BLOCKED | Adapter + OAuth stubs; Lead Sync approval required | LinkedIn |
| TikTok Lead Gen | BLOCKED | Adapter + secret | TikTok app |
| Email webhook | BLOCKED | Adapter; thread replies not new leads | Inbound provider |
| GBP / telephony | PARTIAL | Manual/source fields; no live GBP API | Optional |
| CSV / custom webhook | PARTIAL | Implemented; needs secrets | INGEST_WEBHOOK_SECRET |
| n8n scheduler | PARTIAL | Templates + tick API; not connected until API test | n8n host |

Unified ingest: all listed adapters call `ingestNormalizedLead` / `ingestLead`. Replay uses provider+event_id. Outage of n8n does not roll back lead insert.

### WhatsApp / Social / n8n

| Feature | Status | Notes |
|---|---|---|
| WhatsApp send eligibility | PASS unit | No send without consent/window/template |
| WhatsApp live send | BLOCKED | Credentials |
| Social mark published | PASS unit | Requires provider post id |
| Social live Graph | BLOCKED | Token |
| Vercel every-minute cron | FAIL→fixed | Removed; Hobby check 0 crons |
| n8n schedules | PARTIAL | JSON in `n8n/workflows/`; import + activate required |

### Reports

| Feature | Status | Notes |
|---|---|---|
| Daily/weekly/monthly windows | FAIL→fixed | Now IST calendar dates via `istDateKey` / `inIstRange` |
| Cash vs booking value | PASS | KPI copy + profitability tests |
| Register CSV | PARTIAL | CSV yes, Excel/PDF no |
| Scheduled email reports | PARTIAL | Snapshot in-app; email pending Resend |

### Audit / security

| Feature | Status | Notes |
|---|---|---|
| Append-only audit | PASS SQL | Triggers prevent update/delete |
| Webhook HMAC/bearer | PASS unit | Meta/WhatsApp/custom |
| Rate limit | PARTIAL→improved | Was in-memory; Postgres `hit_rate_limit` added |
| Secrets in git | PASS | `.env*` gitignored; `.env.example` empty |
| Sentry | BLOCKED | Optional DSN |
| Backups | PARTIAL | Documented in BACKUP.md; restore drill not run here |

---

## Fixes applied this audit

1. Removed Hobby-illegal Vercel cron; n8n tick architecture (`docs/N8N.md`).
2. IST reporting windows.
3. Anon package policy uses `website_status`.
4. Partner-scoped contacts/bookings RLS; operations_manager in `can_view_all_leads`.
5. Durable rate-limit RPC; webhooks/enquiry use it.
6. robots.txt + login/setup/forgot-password noindex.

## Remaining before public launch

Apply migrations 0009–0011. Set production env. Import n8n workflows. Connect Meta/WhatsApp only after live tests. Do not call the product fully production-ready until those external connections succeed.
