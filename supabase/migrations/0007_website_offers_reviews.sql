-- Additive public-site offers + richer testimonials. Does not alter CRM booking tables.

alter table public.website_testimonials
  add column if not exists traveller_name text,
  add column if not exists destination text,
  add column if not exists rating int,
  add column if not exists photo_url text,
  add column if not exists featured boolean not null default false,
  add column if not exists package_id uuid references public.packages (id) on delete set null,
  add column if not exists photo_permission boolean not null default false;

alter table public.website_testimonials drop constraint if exists website_testimonials_rating_check;
alter table public.website_testimonials
  add constraint website_testimonials_rating_check
  check (rating is null or (rating >= 1 and rating <= 5));

alter table public.website_testimonials drop constraint if exists website_testimonials_status_check;
alter table public.website_testimonials
  add constraint website_testimonials_status_check
  check (status in ('draft', 'pending', 'published', 'rejected'));

create table if not exists public.website_offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  discount_label text,
  coupon_code text,
  valid_until date,
  applicable_trips text,
  banner_image_url text,
  cta_label text,
  cta_href text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint website_offers_status_check check (status in ('draft', 'published', 'expired', 'archived'))
);

alter table public.website_offers enable row level security;
create policy website_offers_staff on public.website_offers for all to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
revoke all on public.website_offers from anon, public;
