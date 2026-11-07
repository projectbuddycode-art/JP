# Northridge — Himalayan travel CRM

Production-oriented CRM for a travel desk specialising in Spiti Valley, Manali, Ladakh, and Himalayan itineraries.

Stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase (Postgres, Auth, Storage), server routes, and a database-backed job queue.

## Local development

1. Copy `.env.example` to `.env.local` and fill values. Never commit secrets.
2. Create a Supabase project.
3. Run SQL in `supabase/migrations/` in order (`0001_init.sql`, then `0002_rls.sql`).
4. Optional development seed: `supabase/seed.sql` (sets `demo_mode` and labelled demo contacts/packages). Do not run seed in production.
5. Install and start:

```bash
npm install
npm run db:validate
npm test
npm run lint
npm run typecheck
npm run dev
```

6. Open `/login`, create the first account, then complete `/setup` using `OWNER_BOOTSTRAP_SECRET` or `OWNER_BOOTSTRAP_EMAIL`.

## Owner bootstrap

`claim_first_owner` is executable only with the service role. The Next.js action additionally requires a matching bootstrap email or secret. There is no public endpoint that grants owner to arbitrary users.

Invited team members become `active` when their email exists in `team_invites`. Uninvited sign-ups remain `invited` until the owner invites them.

## Product surfaces

- `/overview` — live KPIs from the database
- `/leads` `/pipeline` `/contacts` `/bookings` `/packages`
- `/inbox` WhatsApp Cloud API workspace
- `/social` composer + schedule queue
- `/automation` workflow editor, dry-run, execution history
- `/campaigns` `/reports` `/integrations` `/settings`
- `/enquire` public form
- `/p/[slug]` published packages
- `/proposal/[token]` public proposal (no CRM notes)

## Jobs

`GET /api/cron/jobs` with `Authorization: Bearer $CRON_SECRET` claims due jobs (follow-up scan, social publish, WhatsApp send, automation). Vercel cron is defined in `vercel.json`.

## Tests

Automated tests cover phone normalisation, duplicate matching, next actions, workflow validation, WhatsApp eligibility, Google Ads webhook helpers, HMAC verification, social publish guards, and log redaction.

Provider E2E tests require live credentials and are listed as pending in `docs/ACCEPTANCE.md`.
