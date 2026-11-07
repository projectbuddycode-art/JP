-- Travel operations: departures, travellers, costs. Additive. No data reset.

alter table public.profiles drop constraint if exists profiles_workspace_role_check;
alter table public.profiles
  add constraint profiles_workspace_role_check
  check (workspace_role in ('owner', 'admin', 'partner', 'sales', 'viewer', 'trip_leader', 'finance'));

alter table public.bookings
  add column if not exists departure_id uuid,
  add column if not exists refunded_amount numeric(12,2) not null default 0;

alter table public.suppliers
  add column if not exists location text,
  add column if not exists payment_terms text,
  add column if not exists agreed_pricing text,
  add column if not exists internal_rating numeric(3,1),
  add column if not exists active boolean not null default true,
  add column if not exists contact_person text;

create table if not exists public.departures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  package_id uuid references public.packages (id) on delete set null,
  destination text,
  start_date date not null,
  end_date date,
  start_location text,
  end_location text,
  capacity int not null default 12,
  min_group_size int,
  trip_leader_id uuid references public.profiles (id) on delete set null,
  operations_manager_id uuid references public.profiles (id) on delete set null,
  vehicle_notes text,
  status text not null default 'planning',
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departures_status_check check (status in (
    'planning', 'open', 'filling', 'full', 'confirmed', 'ready', 'in_progress', 'completed', 'cancelled'
  ))
);

alter table public.bookings drop constraint if exists bookings_departure_id_fkey;
alter table public.bookings
  add constraint bookings_departure_id_fkey
  foreign key (departure_id) references public.departures (id) on delete set null;

create table if not exists public.departure_travellers (
  id uuid primary key default gen_random_uuid(),
  departure_id uuid not null references public.departures (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  full_name text not null,
  phone_e164 text,
  email text,
  emergency_contact text,
  date_of_birth date,
  document_status text not null default 'pending',
  arrival_details text,
  departure_details text,
  room_preference text,
  food_preference text,
  special_requirements text,
  attendance text not null default 'expected',
  created_at timestamptz not null default now()
);

create table if not exists public.itinerary_days (
  id uuid primary key default gen_random_uuid(),
  package_id uuid references public.packages (id) on delete cascade,
  departure_id uuid references public.departures (id) on delete cascade,
  day_number int not null,
  day_date date,
  location text,
  route text,
  start_point text,
  end_point text,
  activities text,
  duration_notes text,
  accommodation text,
  meals text,
  transport text,
  customer_notes text,
  internal_notes text,
  completed_at timestamptz
);

create table if not exists public.departure_suppliers (
  id uuid primary key default gen_random_uuid(),
  departure_id uuid not null references public.departures (id) on delete cascade,
  supplier_id uuid references public.suppliers (id) on delete set null,
  service text,
  service_date date,
  quantity numeric(10,2),
  agreed_cost numeric(12,2) not null default 0,
  advance_paid numeric(12,2) not null default 0,
  status text not null default 'requested',
  booking_reference text,
  payment_due date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  paid_on date not null,
  method text,
  reference text,
  recorded_by uuid references public.profiles (id) on delete set null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.trip_expenses (
  id uuid primary key default gen_random_uuid(),
  departure_id uuid not null references public.departures (id) on delete cascade,
  category text not null,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  incurred_on date,
  notes text,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.departure_checklist (
  id uuid primary key default gen_random_uuid(),
  departure_id uuid not null references public.departures (id) on delete cascade,
  item_key text not null,
  label text not null,
  group_name text not null,
  critical boolean not null default false,
  completed boolean not null default false,
  completed_at timestamptz,
  unique (departure_id, item_key)
);

create table if not exists public.trip_incidents (
  id uuid primary key default gen_random_uuid(),
  departure_id uuid not null references public.departures (id) on delete cascade,
  body text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists departures_start_idx on public.departures (start_date);
create index if not exists departure_travellers_dep_idx on public.departure_travellers (departure_id);
create index if not exists booking_payments_booking_idx on public.booking_payments (booking_id);

alter table public.departures enable row level security;
alter table public.departure_travellers enable row level security;
alter table public.itinerary_days enable row level security;
alter table public.departure_suppliers enable row level security;
alter table public.booking_payments enable row level security;
alter table public.trip_expenses enable row level security;
alter table public.departure_checklist enable row level security;
alter table public.trip_incidents enable row level security;

create policy departures_staff on public.departures for all to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy departure_travellers_staff on public.departure_travellers for all to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy itinerary_days_staff on public.itinerary_days for all to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy departure_suppliers_staff on public.departure_suppliers for all to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy booking_payments_staff on public.booking_payments for all to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy trip_expenses_staff on public.trip_expenses for all to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy departure_checklist_staff on public.departure_checklist for all to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy trip_incidents_staff on public.trip_incidents for all to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
