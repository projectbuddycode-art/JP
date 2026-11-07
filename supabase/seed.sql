-- Development seed only. Never run against production.
-- This file is labelled demo data via workspace_settings.demo_mode.

update public.workspace_settings
set demo_mode = true, business_name = 'Northridge Demo Workspace'
where id = '00000000-0000-0000-0000-000000000001';

insert into public.contacts (id, full_name, phone_e164, email, city, consent_marketing, whatsapp_opt_in)
values
  ('11111111-1111-1111-1111-111111111111', 'Ananya Sharma', '+919811112221', 'ananya.demo@example.com', 'Delhi', true, true),
  ('22222222-2222-2222-2222-222222222222', 'Rohit Mehta', '+919822223331', 'rohit.demo@example.com', 'Mumbai', false, true),
  ('33333333-3333-3333-3333-333333333333', 'Priya Nair', '+919833334441', 'priya.demo@example.com', 'Bengaluru', true, false)
on conflict do nothing;

insert into public.campaigns (id, name, destination, source, platform, recorded_spend)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Spiti Summer 2026', 'Spiti Valley', 'meta', 'instagram', 25000)
on conflict do nothing;

insert into public.packages (id, name, slug, destination, region, short_description, duration_days, price_per_person, status, itinerary, inclusions, exclusions)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Spiti Valley Circuit', 'spiti-valley-circuit', 'Spiti Valley', 'Himachal Pradesh',
   'A high-altitude circuit covering Kaza, Key Monastery, and Chandratal.', 8, 42500, 'published',
   '[{"day":1,"title":"Manali to Kaza"},{"day":2,"title":"Kaza and Key Monastery"}]'::jsonb,
   'Stay, breakfast, inner line permit assistance', 'Flights, personal expenses'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Ladakh Road Trip', 'ladakh-road-trip', 'Ladakh', 'Ladakh',
   'Leh, Nubra, and Pangong with acclimatisation days.', 9, 48900, 'published',
   '[{"day":1,"title":"Arrive Leh"}]'::jsonb, 'Stay, transport', 'Airfare'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Manali Weekend Escape', 'manali-weekend-escape', 'Manali', 'Himachal Pradesh',
   'A short Solang and Old Manali weekend.', 3, 14500, 'published',
   '[{"day":1,"title":"Arrive Manali"}]'::jsonb, 'Stay and breakfast', 'Adventure activities')
on conflict do nothing;
