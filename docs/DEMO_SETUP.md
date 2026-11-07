# JP client demonstration (no production Supabase)

Demo login is isolated. It is **off** unless `DEMO_MODE=true`. Credentials live only in the host environment. They are not in the Git repository and not in client JavaScript.

## Vercel environment

| Variable | Required | Notes |
|---|---|---|
| `DEMO_MODE` | yes | Must be the string `true` |
| `DEMO_USERNAME` | yes | Issued privately (not stored in git) |
| `DEMO_PASSWORD` | yes | Issued privately (not stored in git) |
| `DEMO_SESSION_SECRET` | yes | `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | yes | The Vercel URL, `https://…` |
| `NEXT_PUBLIC_APP_NAME` | optional | Northridge |

Leave **all** `NEXT_PUBLIC_SUPABASE_*` and `SUPABASE_SERVICE_ROLE_KEY` empty while the demonstration is isolated.

When production Supabase is ready: set `DEMO_MODE=false` (or remove it), add Supabase keys, and redeploy. Demo login will stop working. Frontend routes stay the same.

## Behaviour

- Sign-in is a server action. Password never returns in JSON.
- Session cookie `nr_demo_session`: HttpOnly, SameSite=Lax, Secure on Vercel, 12-hour expiry.
- CRM routes redirect to `/login` without a valid cookie.
- Logout deletes the cookie.
- Data is an in-memory demo store (`src/lib/demo/store.ts`). **Reset demo data** on Settings restores it. A Vercel serverless instance may reset on cold start as well.
- Integrations show `DEMO / Not Connected`. No fake publishes or inbound leads from Meta/WhatsApp.
- Public `/trips` listings come from the same isolated store while demo mode is on.

## Local

Copy `.env.example` to `.env.local`, set the four demo variables, `npm run dev`, open `/login`.
