# Remaining external dependencies

The application is not fully production-ready until these are done on real infrastructure.

1. **Supabase production project** with migrations 0001–0011 applied and a backup tested.
2. **Owner account** created via `/setup` using server env (then rotate/remove bootstrap password).
3. **n8n** always-on host, env `CRM_BASE_URL` + `CRM_CRON_SECRET`, imported workflows activated, Automation Center test green.
4. **Meta** app: Lead Ads, Instagram messaging/comments as needed, webhook verify, HMAC secret.
5. **WhatsApp Business Platform**: WABA, phone, approved templates, webhook.
6. **Google Ads** lead form webhook key + a real form submission.
7. **LinkedIn Lead Sync** approval before claiming LinkedIn connected.
8. **TikTok** lead ads app credentials.
9. **Resend** (or equivalent) if email report delivery is required.
10. **Graph tokens** in `integration_secrets` before social publishing.
11. **Sentry DSN** if error monitoring is required.
12. **Search Console / GA4 / Pixel** only after cookie consent.

Until 3–6 succeed, those channels stay Not Connected / BLOCKED. Website + manual + CSV leads still work once Supabase is live.
