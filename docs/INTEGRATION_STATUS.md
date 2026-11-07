# Integration status

A provider is **Connected** only after credentials exist **and** a live test or verified event succeeds. Cards in `/integrations` follow that rule.

| Provider | Code path | Webhook | Auth | Live status |
|---|---|---|---|---|
| Website forms | `actions/public.ts` | n/a | Consent + rate limit | Ready when service role works |
| Meta Lead Ads | `api/webhooks/meta` | HMAC SHA-256 | App secret + verify token | BLOCKED until Meta app |
| Instagram messaging | same Meta webhook | HMAC | Messaging permission | BLOCKED |
| Instagram comments | classifyComment | HMAC | Comments permission | BLOCKED; likes/followers never scraped |
| WhatsApp Cloud | `api/webhooks/whatsapp` | HMAC | App secret + WABA | BLOCKED |
| Google Ads forms | `api/webhooks/google-ads` | `google_key` | Shared key | BLOCKED |
| LinkedIn Lead Gen | `api/webhooks/linkedin` + OAuth routes | secret | Lead Sync approval | BLOCKED |
| TikTok Lead Gen | `api/webhooks/tiktok` | token/secret | App | BLOCKED |
| Email | `api/webhooks/email` | HMAC/bearer | Inbound provider | BLOCKED |
| Custom | `api/webhooks/custom` | HMAC or bearer | `INGEST_WEBHOOK_SECRET` | Ready when secret set |
| CSV | CRM import | n/a | Signed-in user | Ready |
| Manual / referral / phone | CRM create lead | n/a | Role | Ready |
| n8n | `/automation` + tick API | outbound optional | API key server-only | BLOCKED until Test n8n API succeeds |
| Instagram/Facebook publish | `lib/social/publish.ts` | Graph | Page token in `integration_secrets` | BLOCKED; not marked published without post id |

Optional outbound `N8N_INGEST_WEBHOOK_URL` fires after the lead row exists. Failure is ignored.
