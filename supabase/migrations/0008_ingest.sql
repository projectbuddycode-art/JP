-- Unified lead ingestion. Additive. No data reset.

alter table public.leads
  add column if not exists provider text,
  add column if not exists source_type text,
  add column if not exists provider_account_id text,
  add column if not exists provider_lead_id text,
  add column if not exists provider_event_id text,
  add column if not exists campaign_name text,
  add column if not exists ad_name text,
  add column if not exists submitted_at timestamptz,
  add column if not exists first_response_at timestamptz,
  add column if not exists needs_review boolean not null default false,
  add column if not exists ingest_metadata jsonb not null default '{}'::jsonb;

alter table public.integration_events
  add column if not exists source_type text,
  add column if not exists outcome text,
  add column if not exists processing_step text,
  add column if not exists idempotency_key text,
  add column if not exists qualify_as_lead boolean;

alter table public.integration_connections
  add column if not exists account_name text,
  add column if not exists connected_assets jsonb not null default '[]'::jsonb,
  add column if not exists last_lead_at timestamptz,
  add column if not exists last_health_check_at timestamptz,
  add column if not exists authorization_status text;

create table if not exists public.integration_event_attempts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.integration_events (id) on delete cascade,
  attempt_no int not null default 1,
  status text not null,
  processing_step text,
  error_detail text,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_source_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  provider text not null,
  source_type text,
  event_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_field_values (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  field_name text not null,
  field_value text,
  source text
);

create table if not exists public.webhook_subscriptions (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  topic text,
  callback_url text,
  verify_token_set boolean not null default false,
  status text not null default 'not_configured',
  last_verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.provider_sync_cursors (
  provider text primary key,
  cursor text,
  last_success_at timestamptz,
  lag_seconds int,
  notes text
);

create table if not exists public.communication_preferences (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  channel text not null,
  allowed boolean not null default true,
  source text,
  updated_at timestamptz not null default now()
);

insert into public.integration_connections (provider, display_name, required_permissions, status) values
  ('instagram_messaging', 'Instagram Messaging', array['instagram_manage_messages','pages_manage_metadata'], 'not_configured'),
  ('linkedin', 'LinkedIn Lead Gen', array['r_ads_leadgen_automation'], 'not_configured'),
  ('tiktok', 'TikTok Lead Generation', array['lead.webhook'], 'not_configured'),
  ('google_business', 'Google Business tracking', array[]::text[], 'not_configured'),
  ('custom_webhook', 'Custom webhooks / API', array['ingest_secret'], 'not_configured'),
  ('csv_import', 'CSV import', array[]::text[], 'pending')
on conflict (provider) do nothing;

update public.integration_connections
set status = 'pending', authorization_status = 'first_party'
where provider = 'website_form';

update public.integration_connections
set authorization_status = 'developer_access_required'
where provider = 'linkedin' and authorization_status is null;

alter table public.integration_event_attempts enable row level security;
alter table public.lead_source_events enable row level security;
alter table public.lead_field_values enable row level security;
alter table public.webhook_subscriptions enable row level security;
alter table public.provider_sync_cursors enable row level security;
alter table public.communication_preferences enable row level security;

create policy ingest_staff_events on public.integration_event_attempts for select to authenticated
  using (public.is_active_user());
create policy ingest_staff_source on public.lead_source_events for select to authenticated
  using (public.is_active_user());
create policy ingest_staff_fields on public.lead_field_values for select to authenticated
  using (public.is_active_user());
create policy ingest_staff_hooks on public.webhook_subscriptions for select to authenticated
  using (public.is_active_user());
create policy ingest_staff_cursors on public.provider_sync_cursors for select to authenticated
  using (public.is_active_user());
create policy ingest_staff_prefs on public.communication_preferences for select to authenticated
  using (public.is_active_user());
