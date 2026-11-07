# Acceptance test results

Date: 2026-11-08

## Automated (this workspace)

| Command | Result |
|---|---|
| `npm test` | 62 passed (19 files) |
| `npm run lint` | pass |
| `npm run typecheck` | pass after `next build` typegen |
| `npm run db:validate` | pass |
| `npm run hobby:check` | 0 Vercel cron jobs |
| `npm run build` | pass (Next.js 16.4.2, 75 routes) |

Critical journey **unit** tests (`src/lib/release/journey.test.ts`):

1. Draft/unpublished packages are not publicly listed — PASS
2. Proposal status `sent` is not a booking confirmation — PASS
3. Critical checklist blocks ready — PASS
4. Booking value ≠ cash collected — PASS
5. Hobby cron empty + n8n job worker catalog — PASS
6. IST date window excludes UTC-next-calendar-day leads — PASS (`intelligence.test.ts`)
7. Ingest classification / HMAC / contact match — PASS (`ingest.test.ts`)
8. WhatsApp eligibility — PASS
9. Social publish guard — PASS

## Not executed against production data

- Browser click-through of every CRM role
- Live Meta/WhatsApp/Google Ads webhooks
- Live n8n execution against production
- Restore from backup
- Partner IDOR test on a live Supabase project (SQL policies added; must be applied)

Safe demo records only. No production bookings were modified.
