alter table public.report_runs
  add column if not exists summary jsonb;

create table if not exists public.automation_schedules (
  key text primary key,
  name text not null,
  cadence text not null,
  timezone text not null default 'Asia/Kolkata',
  job_type text not null,
  n8n_cron text not null,
  n8n_workflow_id text,
  enabled boolean not null default true,
  last_enqueued_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  next_run_at timestamptz not null default now(),
  retry_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.automation_schedules enable row level security;

drop policy if exists automation_schedules_read on public.automation_schedules;
create policy automation_schedules_read on public.automation_schedules
  for select to authenticated using (public.is_active_user());

insert into public.automation_schedules (key, name, cadence, job_type, n8n_cron, next_run_at)
values
  ('jobs.process', 'Due job worker', 'every_5m', 'jobs.process', '*/5 * * * *', now()),
  ('followup.scan', 'Lead follow-up reminders', 'every_15m', 'followup.scan', '*/15 * * * *', now()),
  ('report.daily', 'Daily management report', 'daily_08', 'report.daily', '0 8 * * *', now()),
  ('report.weekly', 'Weekly partner report', 'weekly_mon_08', 'report.weekly', '0 8 * * 1', now()),
  ('report.monthly', 'Monthly management report', 'monthly_1_08', 'report.monthly', '0 8 1 * *', now()),
  ('payments.remind', 'Payment due reminders', 'daily_09', 'payments.remind', '0 9 * * *', now()),
  ('departures.alert', 'Upcoming departure alerts', 'daily_0930', 'departures.alert', '30 9 * * *', now()),
  ('documents.remind', 'Traveller document reminders', 'daily_10', 'documents.remind', '0 10 * * *', now()),
  ('suppliers.remind', 'Supplier confirmation reminders', 'daily_1030', 'suppliers.remind', '30 10 * * *', now()),
  ('social.publish', 'Social media publishing', 'every_5m', 'jobs.process', '*/5 * * * *', now())
on conflict (key) do nothing;
