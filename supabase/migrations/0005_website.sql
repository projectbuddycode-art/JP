-- Public website + CMS, additive. Does not drop CRM tables.

alter table public.packages
  add column if not exists website_status text not null default 'draft',
  add column if not exists cover_image_url text,
  add column if not exists video_url text,
  add column if not exists trip_type text,
  add column if not exists highlights jsonb not null default '[]'::jsonb,
  add column if not exists price_visibility text not null default 'starting_from',
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists og_image_url text,
  add column if not exists published_at timestamptz,
  add column if not exists scheduled_for timestamptz,
  add column if not exists unpublished_at timestamptz;

update public.packages
set website_status = 'published', published_at = coalesce(published_at, now())
where status = 'published' and website_status = 'draft';

alter table public.packages drop constraint if exists packages_website_status_check;
alter table public.packages
  add constraint packages_website_status_check
  check (website_status in ('draft', 'pending_approval', 'published', 'scheduled', 'unpublished', 'archived'));

alter table public.packages drop constraint if exists packages_price_visibility_check;
alter table public.packages
  add constraint packages_price_visibility_check
  check (price_visibility in ('fixed', 'starting_from', 'request_quote', 'contact'));

create table if not exists public.website_pages (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  status text not null default 'published',
  seo_title text,
  seo_description text,
  updated_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.website_revisions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  content jsonb not null,
  editor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.website_destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  summary text,
  overview text,
  highlights jsonb not null default '[]'::jsonb,
  faqs jsonb not null default '[]'::jsonb,
  hero_image_url text,
  gallery jsonb not null default '[]'::jsonb,
  best_season text,
  seo_title text,
  seo_description text,
  status text not null default 'published',
  updated_at timestamptz not null default now()
);

create table if not exists public.website_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  body text,
  cover_image_url text,
  destination_slug text,
  category text,
  author_name text,
  status text not null default 'draft',
  seo_title text,
  seo_description text,
  canonical_url text,
  related_package_ids jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create table if not exists public.website_testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  attribution text,
  trip_name text,
  status text not null default 'draft',
  permission_recorded boolean not null default false,
  source_feedback_id uuid references public.customer_feedback (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.website_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  path text,
  package_id uuid references public.packages (id) on delete set null,
  destination_slug text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.package_versions (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages (id) on delete cascade,
  snapshot jsonb not null,
  editor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.leads
  add column if not exists landing_page text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists package_id uuid references public.packages (id) on delete set null;

insert into public.website_pages (page_key, title, content, status, seo_title, seo_description) values
(
  'home',
  'Home',
  '{
    "heroHeading": "Beyond the Ordinary. Into the Himalayas.",
    "heroSubheading": "Discover thoughtfully planned journeys through the mountains, from the landscapes of Spiti Valley to the high roads of Ladakh.",
    "ctaPrimary": "Explore Trips",
    "ctaSecondary": "Plan Your Journey"
  }'::jsonb,
  'published',
  'Northridge — Himalayan journeys',
  'Private and group journeys across Spiti Valley, Manali, and Ladakh. Enquire for a planned itinerary.'
) on conflict (page_key) do nothing;

insert into public.website_destinations (name, slug, summary, overview, status, hero_image_url) values
('Spiti Valley', 'spiti-valley', 'High-altitude villages, monasteries, and long Himalayan horizons.', 'Spiti journeys are planned around season, acclimatisation, and the itinerary you actually need — not a template promise.', 'published', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80'),
('Manali', 'manali', 'A mountain gateway for weekends and longer Himalayan road trips.', 'Manali itineraries are published from the trip catalogue. Road, weather, and permit notes are added by the travel desk when verified.', 'published', 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1600&q=80'),
('Ladakh', 'ladakh', 'High desert roads, lakes, and paced acclimatisation.', 'Ladakh trips listed here are the published packages from the operations desk. Availability is confirmed after conversation.', 'published', 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1600&q=80')
on conflict (slug) do nothing;

alter table public.website_pages enable row level security;
alter table public.website_revisions enable row level security;
alter table public.website_destinations enable row level security;
alter table public.website_articles enable row level security;
alter table public.website_testimonials enable row level security;
alter table public.website_events enable row level security;
alter table public.package_versions enable row level security;

create policy website_pages_staff on public.website_pages for all to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy website_destinations_staff on public.website_destinations for all to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy website_articles_staff on public.website_articles for all to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy website_testimonials_staff on public.website_testimonials for all to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy website_revisions_staff on public.website_revisions for select to authenticated
  using (public.is_active_user());
create policy website_revisions_insert on public.website_revisions for insert to authenticated
  with check (public.is_active_user());
create policy website_events_staff on public.website_events for select to authenticated
  using (public.is_active_user());
create policy package_versions_staff on public.package_versions for select to authenticated
  using (public.is_active_user());
create policy package_versions_insert on public.package_versions for insert to authenticated
  with check (public.is_active_user());

revoke all on public.website_pages from anon, public;
revoke all on public.website_articles from anon, public;
revoke all on public.website_destinations from anon, public;
revoke all on public.website_testimonials from anon, public;
revoke all on public.website_events from anon, public;
revoke all on public.package_versions from anon, public;
revoke all on public.website_revisions from anon, public;
