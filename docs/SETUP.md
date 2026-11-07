# Local development setup

## Prerequisites

- Node.js 20.9+
- A Supabase project
- Optional: Meta app, WhatsApp Cloud API, Google Ads lead form webhook, OpenAI key

## Steps

1. Clone this repository.
2. `npm install`
3. Copy `.env.example` to `.env.local`. Never commit real secrets.
4. In Supabase, run migrations in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
5. Optional development seed: `supabase/seed.sql` (sets `demo_mode = true`).
6. Configure Auth:
   - Enable email/password
   - Add redirect URLs: `http://localhost:3000/auth/callback`
7. Set `OWNER_BOOTSTRAP_EMAIL` to the founder email **or** set a long `OWNER_BOOTSTRAP_SECRET`.
8. `SUPABASE_SERVICE_ROLE_KEY` is required for webhooks, owner claim, and the job worker. It must never be exposed to the browser (`NEXT_PUBLIC_` prefix is forbidden).
9. `npm run dev` and open `http://localhost:3000/login`.

## First owner

`claim_first_owner` is executable only by the service role. The Next.js `/setup` action checks the bootstrap email or secret, then calls that RPC. There is no public endpoint that grants owner to an arbitrary user.

Invited teammates are inserted into `team_invites`. Uninvited sign-ups remain `invited` until the owner adds them.

## Jobs

Hit `GET /api/cron/jobs` with `Authorization: Bearer $CRON_SECRET` or configure Vercel Cron (`vercel.json` runs every minute).
