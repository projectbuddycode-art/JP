# Security audit

## Findings fixed

| Issue | Severity | Fix |
|---|---|---|
| Anon `packages` policy used CRM `status=published`, leaking unpublished website rows via PostgREST | High | `0011` requires `website_status` published |
| Partners could SELECT all contacts and bookings (`is_active_user()`) | High | Scoped policies in `0011` |
| `operations_manager` had app-level view_all but not SQL | Medium | `can_view_all_leads` updated |
| In-memory rate limit on Vercel (per instance) | Medium | `hit_rate_limit` + `enforceRateLimit` |
| robots.txt omitted many CRM paths | Low | Expanded disallow |
| Login/setup indexable | Low | `robots: noindex` layouts |

## Controls already present

- Service role and OAuth secrets are server-only (`serverEnv`, no `NEXT_PUBLIC_` for secrets).
- Bootstrap password is not accepted from the browser.
- `.env*` gitignored except `.env.example`.
- Audit table has update/delete triggers.
- WhatsApp eligibility blocks marketing without consent/opt-out/window.
- Webhooks reject missing HMAC/bearer.
- Cron/tick requires `Authorization: Bearer CRON_SECRET`.
- Workspace metadata `index: false`.
- Social publish requires Graph post id (`canMarkPublished`).

## Residual risk

- RLS is only as strong as migrations applied on the live project. **Apply 0011 before public launch.**
- Demo mode has no RLS (in-memory store).
- `hit_rate_limit` is service-role; if the RPC is missing, code falls back to memory.
- No WAF/CAPTCHA; rate limit + consent only.
- Sentry optional.
- Restore drill not executed in this audit.
