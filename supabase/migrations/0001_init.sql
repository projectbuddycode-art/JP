create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type public.user_role as enum ('owner', 'member');
create type public.profile_status as enum ('active', 'invited', 'disabled');
create type public.lead_priority as enum ('low', 'normal', 'high', 'urgent');
create type public.lead_temperature as enum ('cold', 'warm', 'hot');
create type public.package_status as enum ('draft', 'published', 'archived');
create type public.booking_status as enum ('draft', 'pending', 'confirmed', 'cancelled', 'completed');
create type public.payment_status as enum ('unpaid', 'deposit', 'partial', 'paid', 'refunded');
create type public.proposal_status as enum ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired');
create type public.task_status as enum ('open', 'done', 'cancelled');
create type public.message_direction as enum ('inbound', 'outbound', 'internal');
create type public.message_status as enum ('queued', 'sent', 'delivered', 'read', 'failed');
create type public.social_post_status as enum ('draft', 'pending_approval', 'scheduled', 'publishing', 'published', 'failed');
create type public.job_status as enum ('pending', 'running', 'succeeded', 'failed', 'cancelled');
create type public.integration_status as enum ('not_configured', 'pending', 'connected', 'error', 'expired');
create type public.event_status as enum ('received', 'processing', 'processed', 'failed', 'ignored');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'member',
  status public.profile_status not null default 'invited',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.workspace_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001',
  business_name text not null default 'Northridge Himalayan Journeys',
  timezone text not null default 'Asia/Kolkata',
  default_currency text not null default 'INR',
  default_country text not null default 'IN',
  no_response_hours int not null default 48,
  stale_lead_days int not null default 7,
  demo_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint one_workspace check (id = '00000000-0000-0000-0000-000000000001')
);

create table public.lead_stages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null,
  probability numeric(4,3) not null default 0.1,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  required_fields text[] not null default '{}',
  color text,
  created_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  phone_e164 text,
  email text,
  city text,
  notes text,
  consent_marketing boolean not null default false,
  consent_transactional boolean not null default true,
  whatsapp_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index contacts_phone_unique on public.contacts (phone_e164) where phone_e164 is not null;
create unique index contacts_email_unique on public.contacts (lower(email)) where email is not null;
create index contacts_name_trgm on public.contacts using gin (full_name gin_trgm_ops);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  destination text,
  source text,
  platform text,
  starts_on date,
  ends_on date,
  budget numeric(12,2),
  recorded_spend numeric(12,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete restrict,
  stage_id uuid not null references public.lead_stages (id),
  owner_id uuid references public.profiles (id) on delete set null,
  campaign_id uuid references public.campaigns (id) on delete set null,
  full_name text,
  phone_e164 text,
  email text,
  source text,
  source_record_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  ad_set_id text,
  ad_id text,
  form_id text,
  click_id text,
  destination text,
  preferred_start date,
  preferred_end date,
  date_flexibility text,
  travellers int,
  budget_min numeric(12,2),
  budget_max numeric(12,2),
  currency text not null default 'INR',
  trip_type text,
  preferences text,
  accommodation text,
  transport text,
  qualification_score int,
  qualification_reason text,
  priority public.lead_priority not null default 'normal',
  temperature public.lead_temperature not null default 'warm',
  estimated_value numeric(12,2),
  lost_reason text,
  next_action text,
  next_follow_up_at timestamptz,
  last_interaction_at timestamptz,
  archived_at timestamptz,
  is_test boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index leads_source_record_unique
  on public.leads (source, source_record_id)
  where source_record_id is not null;
create index leads_stage_idx on public.leads (stage_id);
create index leads_owner_idx on public.leads (owner_id);
create index leads_destination_idx on public.leads (destination);
create index leads_follow_up_idx on public.leads (next_follow_up_at);
create index leads_search_idx on public.leads using gin (full_name gin_trgm_ops);

create table public.lead_stage_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  from_stage_id uuid references public.lead_stages (id),
  to_stage_id uuid not null references public.lead_stages (id),
  changed_by uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  destination text not null,
  region text,
  short_description text,
  long_description text,
  duration_days int,
  itinerary jsonb not null default '[]'::jsonb,
  best_season text,
  departure_points text,
  group_size text,
  price_per_person numeric(12,2),
  currency text not null default 'INR',
  inclusions text,
  exclusions text,
  accommodation text,
  transport text,
  difficulty text,
  suitability text,
  faqs jsonb not null default '[]'::jsonb,
  travel_notes text,
  terms text,
  cancellation_policy text,
  status public.package_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.package_media (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages (id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.trip_enquiries (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete restrict,
  lead_id uuid references public.leads (id) on delete set null,
  package_id uuid references public.packages (id) on delete set null,
  destination text,
  start_date date,
  end_date date,
  travellers int,
  estimated_amount numeric(12,2),
  quoted_amount numeric(12,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete restrict,
  lead_id uuid references public.leads (id) on delete set null,
  trip_enquiry_id uuid references public.trip_enquiries (id) on delete set null,
  package_id uuid references public.packages (id) on delete set null,
  campaign_id uuid references public.campaigns (id) on delete set null,
  booking_reference text unique,
  travel_start date,
  travel_end date,
  travellers int,
  estimated_amount numeric(12,2),
  quoted_amount numeric(12,2),
  confirmed_amount numeric(12,2),
  currency text not null default 'INR',
  booking_status public.booking_status not null default 'draft',
  payment_status public.payment_status not null default 'unpaid',
  amount_paid numeric(12,2) not null default 0,
  supplier_notes text,
  operational_notes text,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_confirmed_requires_action check (
    booking_status <> 'confirmed' or confirmed_amount is not null
  )
);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete restrict,
  package_id uuid references public.packages (id) on delete set null,
  public_token text not null unique,
  title text not null,
  body_markdown text,
  amount numeric(12,2),
  currency text not null default 'INR',
  status public.proposal_status not null default 'draft',
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  expires_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  label text not null,
  amount numeric(12,2),
  sort_order int not null default 0
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activities_lead_idx on public.activities (lead_id, created_at desc);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  assigned_to uuid references public.profiles (id) on delete set null,
  title text not null,
  type text not null default 'follow_up',
  status public.task_status not null default 'open',
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_due_idx on public.tasks (status, due_at);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  provider text not null default 'whatsapp',
  provider_thread_id text,
  assigned_to uuid references public.profiles (id),
  unread_count int not null default 0,
  human_takeover boolean not null default false,
  last_customer_message_at timestamptz,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index conversations_provider_thread
  on public.conversations (provider, provider_thread_id)
  where provider_thread_id is not null;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  provider_message_id text,
  direction public.message_direction not null,
  status public.message_status not null default 'queued',
  body text,
  template_name text,
  error_detail text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create unique index messages_provider_id
  on public.messages (provider_message_id)
  where provider_message_id is not null;

create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body text not null,
  category text,
  approved boolean not null default false,
  language text not null default 'en',
  created_at timestamptz not null default now()
);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  channel text not null,
  kind text not null,
  granted boolean not null,
  source text,
  created_at timestamptz not null default now()
);

create table public.suppression_list (
  id uuid primary key default gen_random_uuid(),
  phone_e164 text,
  email text,
  reason text,
  created_at timestamptz not null default now()
);
create unique index suppression_phone on public.suppression_list (phone_e164) where phone_e164 is not null;
create unique index suppression_email on public.suppression_list (lower(email)) where email is not null;

create table public.campaign_attribution (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete set null,
  touch text not null check (touch in ('first', 'latest', 'converted')),
  source text,
  created_at timestamptz not null default now()
);

create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  account_name text,
  account_id text,
  status public.integration_status not null default 'not_configured',
  token_expires_at timestamptz,
  last_error text,
  last_success_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  title text,
  caption text,
  theme text,
  destination text,
  campaign_id uuid references public.campaigns (id) on delete set null,
  hashtags text,
  cta text,
  status public.social_post_status not null default 'draft',
  scheduled_for timestamptz,
  timezone text not null default 'Asia/Kolkata',
  media jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.social_post_platforms (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts (id) on delete cascade,
  platform text not null,
  caption_override text,
  status public.social_post_status not null default 'draft',
  provider_post_id text,
  last_error text,
  published_at timestamptz
);

create table public.social_metrics (
  id uuid primary key default gen_random_uuid(),
  post_platform_id uuid not null references public.social_post_platforms (id) on delete cascade,
  reach int,
  impressions int,
  engagement int,
  clicks int,
  captured_at timestamptz not null default now(),
  available boolean not null default false
);

create table public.automation_workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  enabled boolean not null default false,
  definition jsonb not null,
  timezone text not null default 'Asia/Kolkata',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.automation_executions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.automation_workflows (id) on delete cascade,
  trigger_type text not null,
  status text not null default 'running',
  dry_run boolean not null default false,
  context jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  run_at timestamptz not null default now(),
  status public.job_status not null default 'pending',
  attempts int not null default 0,
  max_attempts int not null default 5,
  locked_at timestamptz,
  locked_by text,
  idempotency_key text unique,
  last_error text,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index jobs_pending_idx on public.jobs (status, run_at);

create table public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique,
  status public.integration_status not null default 'not_configured',
  display_name text,
  last_success_at timestamptz,
  last_error text,
  required_permissions text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.integration_secrets (
  provider text primary key references public.integration_connections (provider) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.integration_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status public.event_status not null default 'received',
  attempt_count int not null default 0,
  error_detail text,
  lead_id uuid references public.leads (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  payload_minimized jsonb not null default '{}'::jsonb
);
create unique index integration_events_provider_event
  on public.integration_events (provider, event_id)
  where event_id is not null;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','workspace_settings','contacts','campaigns','leads','packages',
    'trip_enquiries','bookings','proposals','tasks','conversations','social_accounts',
    'social_posts','automation_workflows','jobs','integration_connections'
  ]
  loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

insert into public.workspace_settings (id) values ('00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

insert into public.lead_stages (slug, name, sort_order, probability, is_won, is_lost, required_fields) values
  ('new_enquiry', 'New Enquiry', 1, 0.05, false, false, '{}'),
  ('contact_pending', 'Contact Pending', 2, 0.08, false, false, '{}'),
  ('contacted', 'Contacted', 3, 0.12, false, false, '{}'),
  ('qualified', 'Qualified', 4, 0.25, false, false, '{destination}'),
  ('trip_requirements_confirmed', 'Trip Requirements Confirmed', 5, 0.35, false, false, '{destination,preferred_start,travellers}'),
  ('itinerary_shared', 'Itinerary / Package Shared', 6, 0.45, false, false, '{}'),
  ('follow_up_due', 'Follow-up Due', 7, 0.40, false, false, '{}'),
  ('negotiation', 'Negotiation', 8, 0.60, false, false, '{}'),
  ('booking_pending', 'Booking Pending', 9, 0.80, false, false, '{}'),
  ('confirmed_booking', 'Confirmed Booking', 10, 1.00, true, false, '{}'),
  ('travel_completed', 'Travel Completed', 11, 1.00, true, false, '{}'),
  ('lost', 'Lost / Not Proceeding', 12, 0.00, false, true, '{lost_reason}');

insert into public.integration_connections (provider, display_name, required_permissions) values
  ('meta_lead_ads', 'Meta Lead Ads', array['leads_retrieval','pages_manage_ads']),
  ('meta_social', 'Instagram & Facebook publishing', array['pages_manage_posts','instagram_content_publish']),
  ('whatsapp', 'WhatsApp Business Platform', array['whatsapp_business_messaging']),
  ('google_ads', 'Google Ads lead forms', array['webhook_key']),
  ('website_form', 'Website enquiry form', array[]::text[]),
  ('email', 'Email provider', array['api_key']),
  ('n8n', 'n8n (optional)', array['api_key']),
  ('ai', 'AI provider', array['api_key']);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  invited boolean;
begin
  select exists(select 1 from public.team_invites i where lower(i.email) = lower(new.email)) into invited;
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'member',
    case when invited then 'active' else 'invited' end
  );
  if invited then
    delete from public.team_invites where lower(email) = lower(new.email);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.prevent_role_escalation()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and (new.role is distinct from old.role) then
    raise exception 'Role changes must use the owner bootstrap or invite process';
  end if;
  return new;
end;
$$;

create trigger prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();
