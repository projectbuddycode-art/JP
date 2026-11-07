# Backup and recovery

## Database

Use Supabase daily backups (Pro) or `pg_dump` on a schedule.

Restore:

1. Create a maintenance window.
2. Restore the dump to a new database or point-in-time recovery in the dashboard.
3. Re-point `NEXT_PUBLIC_SUPABASE_URL` only after verification.
4. Confirm RLS is still enabled and `integration_secrets` is not readable by `authenticated`.

Point-in-time restore and off-site copies are pending the operator’s Supabase plan. Until configured, treat backup restoration as an external dependency.

## Storage

Download buckets (`package-media`, `social-media`) if used. Tokens in `integration_secrets` should be rotated after a suspected restore of an old dump.

## Application

Redeploy the last known good Git SHA. Jobs in `jobs` with status `running` after a crash should be reset to `pending` if `locked_at` is stale (manual SQL):

```sql
update public.jobs
set status = 'pending', locked_at = null, locked_by = null
where status = 'running' and locked_at < now() - interval '15 minutes';
```
