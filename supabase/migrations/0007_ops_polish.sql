-- Additive ops polish. No data reset.

alter table public.bookings
  add column if not exists amount_received numeric(12,2) not null default 0;

update public.bookings
set amount_received = amount_paid
where amount_received = 0 and amount_paid > 0;

insert into public.lead_stages (slug, name, sort_order, probability, is_won, is_lost, required_fields)
values ('quotation_sent', 'Quotation Sent', 7, 0.50, false, false, '{}')
on conflict (slug) do nothing;

update public.lead_stages set name = 'Requirements Confirmed' where slug = 'trip_requirements_confirmed';
update public.lead_stages set name = 'Package Shared' where slug = 'itinerary_shared';
update public.lead_stages set name = 'Follow-up' where slug = 'follow_up_due';
update public.lead_stages set name = 'Confirmed' where slug = 'confirmed_booking';

update public.lead_stages set sort_order = 8 where slug = 'follow_up_due';
update public.lead_stages set sort_order = 9 where slug = 'negotiation';
update public.lead_stages set sort_order = 10 where slug = 'booking_pending';
update public.lead_stages set sort_order = 11 where slug = 'confirmed_booking';
update public.lead_stages set sort_order = 12 where slug = 'travel_completed';
update public.lead_stages set sort_order = 13 where slug = 'lost';
