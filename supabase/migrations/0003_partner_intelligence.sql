-- Additive upgrade. Does not drop existing tables or production data.

alter table public.profiles
  add column if not exists workspace_role text not null default 'sales',
  add column if not exists last_active_at timestamptz,
  add column if not exists must_change_password boolean not null default false,
  add column if not exists disabled_reason text,
  add column if not exists invited_role text;

update public.profiles
set workspace_role = case when role::text = 'owner' then 'owner' else 'sales' end
where workspace_role is null or (workspace_role = 'sales' and role::text = 'owner');

alter table public.profiles drop constraint if exists profiles_workspace_role_check;
alter table public.profiles
  add constraint profiles_workspace_role_check
  check (workspace_role in ('owner', 'admin', 'partner', 'sales', 'viewer'));

alter table public.workspace_settings
  add column if not exists business_hours_start time not null default '09:00',
  add column if not exists business_hours_end time not null default '19:00',
  add column if not exists first_response_minutes int not null default 30,
  add column if not exists follow_up_hours int not null default 24,
  add column if not exists assignment_mode text not null default 'manual',
  add column if not exists discount_approval_percent numeric(5,2) not null default 10,
  add column if not exists bootstrap_completed_at timestamptz;

alter table public.leads
  add column if not exists received_at timestamptz,
  add column if not exists first_response_at timestamptz,
  add column if not exists sla_due_at timestamptz,
  add column if not exists sla_status text not null default 'pending',
  add column if not exists assigned_at timestamptz,
  add column if not exists public_ref text;

update public.leads set received_at = created_at where received_at is null;

alter table public.bookings
  add column if not exists amount_received numeric(12,2) not null default 0,
  add column if not exists amount_outstanding numeric(12,2),
  add column if not exists refunded_amount numeric(12,2) not null default 0,
  add column if not exists partner_id uuid references public.profiles (id) on delete set null;

alter table public.team_invites
  add column if not exists workspace_role text not null default 'partner',
  add column if not exists permissions jsonb not null default '{}'::jsonb,
  add column if not exists accepted_at timestamptz,
  add column if not exists revoked_at timestamptz;

alter table public.audit_logs
  add column if not exists event_code text,
  add column if not exists actor_email text,
  add column if not exists actor_name text,
  add column if not exists actor_role text,
  add column if not exists entity_name text,
  add column if not exists field_name text,
  add column if not exists previous_value text,
  add column if not exists new_value text,
  add column if not exists source text not null default 'user',
  add column if not exists ip_address text,
  add column if not exists user_agent text,
  add column if not exists correlation_id text,
  add column if not exists automation_execution_id uuid,
  add column if not exists prev_hash text,
  add column if not exists row_hash text;

create table if not exists public.permissions (
  key text primary key,
  label text not null,
  category text not null
);

insert into public.permissions (key, label, category) values
  ('leads.view', 'View leads', 'leads'),
  ('leads.create', 'Create leads', 'leads'),
  ('leads.edit', 'Edit leads', 'leads'),
  ('leads.archive', 'Archive leads', 'leads'),
  ('leads.assign', 'Assign leads', 'leads'),
  ('leads.view_all', 'View all partner leads', 'leads'),
  ('leads.view_own', 'View own leads', 'leads'),
  ('revenue.view', 'View revenue', 'finance'),
  ('reports.financial', 'View financial reports', 'finance'),
  ('records.export', 'Export records', 'records'),
  ('packages.manage', 'Manage packages', 'catalogue'),
  ('bookings.manage', 'Manage bookings', 'operations'),
  ('integrations.manage', 'Manage integrations', 'admin'),
  ('automations.manage', 'Manage automations', 'admin'),
  ('audit.view', 'View audit history', 'admin'),
  ('users.manage', 'Manage users', 'admin'),
  ('settings.manage', 'Manage settings', 'admin')
on conflict (key) do nothing;

create table if not exists public.role_permissions (
  workspace_role text not null,
  permission_key text not null references public.permissions (key) on delete cascade,
  primary key (workspace_role, permission_key)
);

create table if not exists public.user_permission_overrides (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  permission_key text not null references public.permissions (key) on delete cascade,
  allowed boolean not null,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now(),
  primary key (profile_id, permission_key)
);

create table if not exists public.login_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  email text,
  success boolean not null,
  reason text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_assignment_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  from_owner_id uuid references public.profiles (id) on delete set null,
  to_owner_id uuid references public.profiles (id) on delete set null,
  reason text,
  mode text,
  changed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.report_definitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  report_type text not null,
  config jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_schedules (
  id uuid primary key default gen_random_uuid(),
  definition_id uuid references public.report_definitions (id) on delete cascade,
  cadence text not null,
  timezone text not null default 'Asia/Kolkata',
  recipients jsonb not null default '[]'::jsonb,
  channel text not null default 'in_app',
  enabled boolean not null default false,
  next_run_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.report_runs (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid references public.report_schedules (id) on delete set null,
  definition_id uuid references public.report_definitions (id) on delete set null,
  status text not null default 'queued',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error text,
  artifact_path text
);

create table if not exists public.report_deliveries (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.report_runs (id) on delete cascade,
  channel text not null,
  recipient text not null,
  status text not null default 'pending',
  provider_ref text,
  error text,
  delivered_at timestamptz
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  entity_type text,
  entity_id uuid,
  requested_by uuid references public.profiles (id) on delete set null,
  decided_by uuid references public.profiles (id) on delete set null,
  status text not null default 'pending',
  reason text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.approval_history (
  id uuid primary key default gen_random_uuid(),
  approval_id uuid not null references public.approvals (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  decision text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,
  contact_name text,
  phone_e164 text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_operations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings (id) on delete cascade,
  supplier_id uuid references public.suppliers (id) on delete set null,
  checklist jsonb not null default '[]'::jsonb,
  emergency_contact text,
  status text not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_feedback (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete set null,
  score int,
  comment text,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.bootstrap_state (
  id int primary key default 1 check (id = 1),
  completed_at timestamptz,
  completed_by uuid,
  locked boolean not null default false
);

insert into public.bootstrap_state (id, locked) values (1, false) on conflict (id) do nothing;

create index if not exists leads_received_at_idx on public.leads (received_at);
create index if not exists leads_owner_received_idx on public.leads (owner_id, received_at);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index if not exists login_events_created_idx on public.login_events (created_at desc);

create or replace function public.seed_role_permissions()
returns void language plpgsql as $$
begin
  delete from public.role_permissions;
  insert into public.role_permissions (workspace_role, permission_key)
  select 'owner', key from public.permissions;
  insert into public.role_permissions (workspace_role, permission_key)
  select 'admin', key from public.permissions
  where key not in ('users.manage', 'settings.manage', 'integrations.manage');
  insert into public.role_permissions (workspace_role, permission_key) values
    ('partner', 'leads.view'),
    ('partner', 'leads.view_own'),
    ('partner', 'leads.edit'),
    ('partner', 'leads.create'),
    ('partner', 'bookings.manage'),
    ('sales', 'leads.view'),
    ('sales', 'leads.view_own'),
    ('sales', 'leads.edit'),
    ('sales', 'leads.create'),
    ('viewer', 'leads.view'),
    ('viewer', 'leads.view_own');
end;
$$;

select public.seed_role_permissions();

create or replace function public.audit_hash_row()
returns trigger language plpgsql as $$
declare
  prev text;
begin
  select row_hash into prev from public.audit_logs order by created_at desc limit 1;
  new.prev_hash := coalesce(prev, 'genesis');
  new.row_hash := encode(digest(coalesce(new.actor_id::text,'') || new.action || coalesce(new.entity_id::text,'') || coalesce(new.created_at::text,'') || new.prev_hash, 'sha256'), 'hex');
  if new.event_code is null then
    new.event_code := 'AUD-' || to_char(timezone('Asia/Kolkata', now()), 'YYYYMMDD') || '-' || substr(new.id::text, 1, 4);
  end if;
  return new;
end;
$$;

drop trigger if exists audit_hash_row on public.audit_logs;
create trigger audit_hash_row before insert on public.audit_logs
for each row execute function public.audit_hash_row();

create or replace function public.prevent_audit_mutation()
returns trigger language plpgsql as $$
begin
  if current_setting('app.allow_audit_admin', true) is distinct from 'true' then
    raise exception 'Audit records are append-only';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists prevent_audit_update on public.audit_logs;
create trigger prevent_audit_update before update or delete on public.audit_logs
for each row execute function public.prevent_audit_mutation();
