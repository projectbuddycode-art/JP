-- Release hardening: public package visibility, partner isolation, durable rate limits.
-- Additive. Does not reset customer data.

create or replace function public.can_view_all_leads()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active'
      and p.workspace_role in ('owner', 'admin', 'operations_manager')
  );
$$;

create or replace function public.can_view_financial_records()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active'
      and p.workspace_role in ('owner', 'admin', 'finance', 'operations_manager')
  );
$$;

drop policy if exists packages_public_read on public.packages;
create policy packages_public_read on public.packages for select to anon
  using (
    coalesce(website_status, status::text) = 'published'
    and status::text <> 'archived'
  );

drop policy if exists package_media_public_read on public.package_media;
create policy package_media_public_read on public.package_media for select to anon
  using (
    exists (
      select 1 from public.packages p
      where p.id = package_id
        and coalesce(p.website_status, p.status::text) = 'published'
        and p.status::text <> 'archived'
    )
  );

drop policy if exists contacts_read on public.contacts;
create policy contacts_read on public.contacts for select to authenticated
  using (
    public.is_active_user() and (
      public.can_view_all_leads()
      or exists (
        select 1 from public.leads l
        where l.contact_id = contacts.id and l.owner_id = auth.uid()
      )
    )
  );

drop policy if exists bookings_read on public.bookings;
create policy bookings_read on public.bookings for select to authenticated
  using (
    public.is_active_user() and (
      public.can_view_financial_records()
      or partner_id = auth.uid()
      or exists (
        select 1 from public.leads l
        where l.id = bookings.lead_id and l.owner_id = auth.uid()
      )
    )
  );

create table if not exists public.rate_limit_buckets (
  key text primary key,
  count int not null default 0,
  reset_at timestamptz not null
);

revoke all on public.rate_limit_buckets from anon, authenticated, public;

create or replace function public.hit_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.rate_limit_buckets%rowtype;
begin
  insert into public.rate_limit_buckets (key, count, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update
    set count = case when public.rate_limit_buckets.reset_at < now() then 1 else public.rate_limit_buckets.count + 1 end,
        reset_at = case when public.rate_limit_buckets.reset_at < now() then now() + make_interval(secs => p_window_seconds) else public.rate_limit_buckets.reset_at end
  returning * into rec;
  return rec.count <= p_limit;
end;
$$;

revoke all on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;
