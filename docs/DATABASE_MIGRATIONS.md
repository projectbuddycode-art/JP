# Database migrations

Apply in order against the **existing** project. Do not run `seed.sql` in production.

| File | Purpose |
|---|---|
| `0001_init.sql` | Core CRM schema |
| `0002_rls.sql` | RLS + claim_first_owner |
| `0003_partner_intelligence.sql` | Partners, audit extras, reports |
| `0004_rls_v2.sql` | Lead ownership policies, audit insert |
| `0005_website.sql` | Website publishing columns |
| `0006_operations.sql` | Departures, travellers, suppliers |
| `0007_ops_polish.sql` | Ops polish |
| `0008_ingest.sql` | Unified ingest tables |
| `0009_v3.sql` | operations_manager role |
| `0010_n8n_schedules.sql` | `automation_schedules`, report summary |
| `0011_release_hardening.sql` | Public package policy, partner RLS, rate limit RPC |

`npm run db:validate` only checks SQL files in git, not the live database.
