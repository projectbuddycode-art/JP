import { DEMO_OWNER_ID } from "@/lib/auth/demo-token";

const now = new Date();
const iso = (days: number) => new Date(now.getTime() + days * 86_400_000).toISOString();

const stages = [
  { id: "s1", slug: "new_enquiry", name: "New Enquiry", sort_order: 1, probability: 0.05, is_won: false, is_lost: false, required_fields: [] },
  { id: "s2", slug: "contact_pending", name: "Contact Pending", sort_order: 2, probability: 0.08, is_won: false, is_lost: false, required_fields: [] },
  { id: "s3", slug: "contacted", name: "Contacted", sort_order: 3, probability: 0.12, is_won: false, is_lost: false, required_fields: [] },
  { id: "s4", slug: "qualified", name: "Qualified", sort_order: 4, probability: 0.25, is_won: false, is_lost: false, required_fields: ["destination"] },
  { id: "s5", slug: "trip_requirements_confirmed", name: "Requirements Confirmed", sort_order: 5, probability: 0.35, is_won: false, is_lost: false, required_fields: [] },
  { id: "s6", slug: "itinerary_shared", name: "Package Shared", sort_order: 6, probability: 0.45, is_won: false, is_lost: false, required_fields: [] },
  { id: "s13", slug: "quotation_sent", name: "Quotation Sent", sort_order: 7, probability: 0.5, is_won: false, is_lost: false, required_fields: [] },
  { id: "s7", slug: "follow_up_due", name: "Follow-up", sort_order: 8, probability: 0.4, is_won: false, is_lost: false, required_fields: [] },
  { id: "s8", slug: "negotiation", name: "Negotiation", sort_order: 9, probability: 0.6, is_won: false, is_lost: false, required_fields: [] },
  { id: "s9", slug: "booking_pending", name: "Booking Pending", sort_order: 10, probability: 0.8, is_won: false, is_lost: false, required_fields: [] },
  { id: "s10", slug: "confirmed_booking", name: "Confirmed", sort_order: 11, probability: 1, is_won: true, is_lost: false, required_fields: [] },
  { id: "s11", slug: "travel_completed", name: "Travel Completed", sort_order: 12, probability: 1, is_won: true, is_lost: false, required_fields: [] },
  { id: "s12", slug: "lost", name: "Lost", sort_order: 13, probability: 0, is_won: false, is_lost: true, required_fields: ["lost_reason"] },
];

export function createDemoStore(email: string) {
  return {
    profiles: [
      {
        id: DEMO_OWNER_ID,
        email,
        full_name: "JP Demo",
        role: "owner",
        workspace_role: "owner",
        status: "active",
        must_change_password: false,
        last_active_at: iso(0),
      },
      {
        id: "partner-demo",
        email: "partner.demo@example.com",
        full_name: "Partner A (demo)",
        role: "member",
        workspace_role: "partner",
        status: "active",
      },
      {
        id: "sales-demo",
        email: "sales.demo@example.com",
        full_name: "Sales executive (demo)",
        role: "member",
        workspace_role: "sales",
        status: "active",
      },
      {
        id: "finance-demo",
        email: "finance.demo@example.com",
        full_name: "Finance (demo)",
        role: "member",
        workspace_role: "finance",
        status: "active",
      },
    ],
    workspace_settings: [
      {
        id: "00000000-0000-0000-0000-000000000001",
        business_name: "JP Himalayan Journeys (demo)",
        timezone: "Asia/Kolkata",
        default_currency: "INR",
        demo_mode: true,
      },
    ],
    lead_stages: stages,
    contacts: [
      { id: "c1", full_name: "Ananya Sharma", phone_e164: "+919811112221", email: "ananya.demo@example.com", city: "Delhi", consent_marketing: true, whatsapp_opt_in: true },
      { id: "c2", full_name: "Rohit Mehta", phone_e164: "+919822223331", email: "rohit.demo@example.com", city: "Mumbai", consent_marketing: false, whatsapp_opt_in: true },
      { id: "c3", full_name: "Priya Nair", phone_e164: "+919833334441", email: "priya.demo@example.com", city: "Bengaluru", consent_marketing: true, whatsapp_opt_in: false },
    ],
    campaigns: [
      { id: "camp1", name: "Spiti Summer 2026", destination: "Spiti Valley", source: "meta", platform: "instagram", recorded_spend: 25000 },
    ],
    leads: [
      { id: "l1", contact_id: "c1", stage_id: "s4", owner_id: DEMO_OWNER_ID, campaign_id: "camp1", full_name: "Ananya Sharma", phone_e164: "+919811112221", email: "ananya.demo@example.com", destination: "Spiti Valley", source: "instagram", travellers: 4, budget_max: 180000, estimated_value: 170000, currency: "INR", priority: "high", next_follow_up_at: iso(0), last_interaction_at: iso(-1), created_at: iso(-6), archived_at: null, is_test: false },
      { id: "l2", contact_id: "c2", stage_id: "s1", owner_id: "partner-demo", full_name: "Rohit Mehta", phone_e164: "+919822223331", email: "rohit.demo@example.com", destination: "Ladakh", source: "website_form", travellers: 2, budget_max: 120000, estimated_value: 98000, currency: "INR", priority: "normal", next_follow_up_at: iso(-1), last_interaction_at: iso(-2), created_at: iso(-2), received_at: iso(-2), archived_at: null, is_test: false },
      { id: "l3", contact_id: "c3", stage_id: "s10", owner_id: DEMO_OWNER_ID, full_name: "Priya Nair", phone_e164: "+919833334441", email: "priya.demo@example.com", destination: "Manali", source: "referral", travellers: 6, budget_max: 90000, estimated_value: 87000, currency: "INR", priority: "normal", last_interaction_at: iso(-3), created_at: iso(-20), archived_at: null, is_test: false },
    ],
    packages: [
      { id: "p1", name: "Spiti Valley Circuit", slug: "spiti-valley-circuit", destination: "Spiti Valley", region: "Himachal Pradesh", short_description: "Kaza, Key Monastery, and Chandratal.", duration_days: 8, price_per_person: 42500, currency: "INR", status: "published", website_status: "published", price_visibility: "starting_from", trip_type: "group", cover_image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80", inclusions: "Stay, breakfast, permit assistance", exclusions: "Flights", accommodation: "Hotels and homestays as published for the departure", transport: "Road transfer as listed on the package", published_at: iso(-20), itinerary: [{ day: 1, location: "Manali", title: "Arrive and brief", description: "Meet the travel desk notes for pickup and overnight." }, { day: 2, location: "Kaza", title: "High-valley drive", description: "Pace for acclimatisation on the published route." }, { day: 3, location: "Key Monastery", title: "Monastery road", description: "A monastery visit as listed on the itinerary." }, { day: 4, location: "Chandratal approach", title: "Lake approach", description: "Included when the season note on the package allows." }] },
      { id: "p2", name: "Ladakh Road Trip", slug: "ladakh-road-trip", destination: "Ladakh", short_description: "Leh, Nubra, Pangong with acclimatisation.", duration_days: 9, price_per_person: 48900, currency: "INR", status: "published", website_status: "published", price_visibility: "starting_from", trip_type: "private", cover_image_url: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1600&q=80", published_at: iso(-18) },
      { id: "p3", name: "Manali Weekend Escape", slug: "manali-weekend-escape", destination: "Manali", short_description: "Solang and Old Manali weekend.", duration_days: 3, price_per_person: 14500, currency: "INR", status: "published", website_status: "published", price_visibility: "starting_from", trip_type: "group", cover_image_url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1600&q=80", published_at: iso(-10) },
      { id: "p4", name: "Unpublished draft circuit", slug: "unpublished-draft-circuit", destination: "Spiti Valley", short_description: "Internal draft.", duration_days: 7, price_per_person: 99999, currency: "INR", status: "draft", website_status: "draft" },
    ],
    bookings: [
      { id: "b1", contact_id: "c3", lead_id: "l3", package_id: "p3", departure_id: "dep1", campaign_id: null, booking_reference: "NR-DEMO-001", travel_start: "2027-06-10", confirmed_amount: 87000, amount_paid: 20000, amount_received: 20000, currency: "INR", booking_status: "confirmed", payment_status: "deposit", created_at: iso(-5) },
    ],
    proposals: [
      { id: "pr1", lead_id: "l1", contact_id: "c1", package_id: "p1", public_token: "demo-token", title: "Spiti family itinerary", amount: 170000, currency: "INR", status: "sent", created_at: iso(-2) },
    ],
    proposal_items: [],
    activities: [
      { id: "a1", lead_id: "l1", contact_id: "c1", type: "lead_created", body: "Lead captured from Instagram (demo)", created_at: iso(-6) },
      { id: "a2", lead_id: "l1", type: "note", body: "Asked for June travel window.", created_at: iso(-1) },
    ],
    tasks: [
      { id: "t1", lead_id: "l1", assigned_to: DEMO_OWNER_ID, title: "Call Ananya about June dates", type: "follow_up", status: "open", due_at: iso(0) },
      { id: "t2", lead_id: "l2", assigned_to: DEMO_OWNER_ID, title: "First contact — Ladakh enquiry", type: "follow_up", status: "open", due_at: iso(-1) },
    ],
    conversations: [
      { id: "conv1", contact_id: "c1", lead_id: "l1", provider: "whatsapp", unread_count: 1, human_takeover: false, last_message_at: iso(-1), last_customer_message_at: iso(-1) },
    ],
    messages: [
      { id: "m1", conversation_id: "conv1", direction: "inbound", status: "delivered", body: "Hi, we are 4 people for Spiti in June", created_at: iso(-1) },
    ],
    message_templates: [],
    consent_records: [],
    suppression_list: [],
    campaign_attribution: [],
    social_accounts: [],
    social_posts: [
      { id: "sp1", title: "Spiti June reminder", caption: "High-altitude summer window — enquire for 2026.", theme: "Seasonal travel campaigns", destination: "Spiti Valley", status: "scheduled", scheduled_for: iso(1), timezone: "Asia/Kolkata" },
    ],
    social_post_platforms: [
      { id: "spp1", post_id: "sp1", platform: "instagram", status: "scheduled", last_error: null },
    ],
    social_metrics: [],
    automation_workflows: [
      { id: "w1", name: "New enquiry task", description: "Create a first-contact task", enabled: true, definition: {}, created_at: iso(-10) },
    ],
    automation_executions: [
      { id: "e1", workflow_id: "w1", trigger_type: "lead_created", status: "succeeded", dry_run: true, started_at: iso(-2) },
    ],
    automation_schedules: [],
    jobs: [
      { id: "j1", type: "social.publish", status: "pending", run_at: iso(1), last_error: null },
    ],
    integration_connections: [
      { provider: "meta_lead_ads", display_name: "Meta Lead Ads", status: "not_configured", last_success_at: null, last_error: null, required_permissions: [] },
      { provider: "meta_social", display_name: "Instagram & Facebook publishing", status: "not_configured", last_success_at: null, last_error: null },
      { provider: "whatsapp", display_name: "WhatsApp Business Platform", status: "not_configured", last_success_at: null, last_error: null },
      { provider: "google_ads", display_name: "Google Ads lead forms", status: "not_configured", last_success_at: null, last_error: null },
      { provider: "website_form", display_name: "Website enquiry form", status: "pending", last_success_at: null, last_error: null },
      { provider: "email", display_name: "Email provider", status: "not_configured", last_success_at: null, last_error: null },
      { provider: "n8n", display_name: "n8n (optional)", status: "not_configured", last_success_at: null, last_error: null },
      { provider: "ai", display_name: "AI provider", status: "not_configured", last_success_at: null, last_error: null },
      { provider: "instagram_messaging", display_name: "Instagram Messaging", status: "not_configured", last_success_at: null, last_error: null },
      { provider: "linkedin", display_name: "LinkedIn Lead Gen", status: "not_configured", authorization_status: "developer_access_required", last_success_at: null, last_error: null },
      { provider: "tiktok", display_name: "TikTok Lead Generation", status: "not_configured", last_success_at: null, last_error: null },
      { provider: "google_business", display_name: "Google Business tracking", status: "not_configured", last_success_at: null, last_error: null },
      { provider: "custom_webhook", display_name: "Custom webhooks / API", status: "not_configured", last_success_at: null, last_error: null },
      { provider: "csv_import", display_name: "CSV import", status: "pending", last_success_at: null, last_error: null },
    ],
    integration_secrets: [],
    integration_events: [],
    integration_event_attempts: [],
    lead_source_events: [],
    lead_field_values: [],
    webhook_subscriptions: [],
    provider_sync_cursors: [],
    communication_preferences: [],
    audit_logs: [
      {
        id: "aud1",
        event_code: "AUD-DEMO-0001",
        actor_id: DEMO_OWNER_ID,
        actor_name: "JP Demo",
        actor_email: email,
        actor_role: "owner",
        action: "lead_created",
        entity_type: "leads",
        entity_id: "l1",
        entity_name: "Ananya Sharma",
        source: "user",
        created_at: iso(-6),
      },
    ],
    login_events: [],
    lead_assignment_history: [],
    approvals: [],
    suppliers: [
      { id: "sup1", name: "Kaza homestay (demo)", kind: "hotel", active: true, location: "Kaza" },
      { id: "sup2", name: "Manali fleet operator (demo)", kind: "vehicle", active: true, location: "Manali" },
      { id: "sup3", name: "Spiti mountain driver (demo)", kind: "driver", active: true, location: "Kaza" },
      { id: "sup4", name: "Local monastery guide (demo)", kind: "guide", active: true, location: "Kaza" },
    ],
    departures: [
      {
        id: "dep1",
        name: "Spiti Valley Circuit — 10 Jun 2027",
        package_id: "p1",
        destination: "Spiti Valley",
        start_date: "2027-06-10",
        end_date: "2027-06-17",
        capacity: 12,
        status: "open",
        trip_leader_id: DEMO_OWNER_ID,
      },
    ],
    departure_travellers: [
      { id: "dt1", departure_id: "dep1", booking_id: "b1", full_name: "Priya Nair", phone_e164: "+919833334441", emergency_contact: "Family +91 98000 00000", attendance: "expected", document_status: "pending" },
    ],
    departure_checklist: [
      { id: "ck1", departure_id: "dep1", item_key: "trip_leader", label: "Trip leader assigned", group_name: "operations", critical: true, completed: true },
      { id: "ck2", departure_id: "dep1", item_key: "hotel_confirmed", label: "Hotel/homestay confirmed", group_name: "accommodation", critical: true, completed: false },
      { id: "ck3", departure_id: "dep1", item_key: "vehicles_assigned", label: "Vehicles assigned", group_name: "transport", critical: true, completed: false },
    ],
    itinerary_days: [
      { id: "it1", departure_id: "dep1", day_number: 1, location: "Manali", activities: "Briefing and overnight.", customer_notes: "Acclimatise. Confirm pickup the evening before.", internal_notes: "Confirm hotel check-in names." },
      { id: "it2", departure_id: "dep1", day_number: 2, location: "Kaza", route: "Manali–Kaza", activities: "High-altitude drive (demo itinerary).", customer_notes: "Pace for acclimatisation.", internal_notes: "Fuel stop checklist." },
    ],
    departure_suppliers: [
      { id: "ds1", departure_id: "dep1", supplier_id: "sup1", service: "Nights 3–5 Kaza", agreed_cost: 48000, advance_paid: 10000, status: "awaiting_confirmation" },
      { id: "ds2", departure_id: "dep1", supplier_id: "sup2", service: "Tempo traveller", agreed_cost: 32000, advance_paid: 0, status: "requested" },
      { id: "ds3", departure_id: "dep1", supplier_id: "sup3", service: "Driver", agreed_cost: 12000, advance_paid: 0, status: "requested" },
    ],
    booking_payments: [
      { id: "pay1", booking_id: "b1", amount: 20000, paid_on: iso(-4).slice(0, 10), method: "upi", recorded_by: DEMO_OWNER_ID, verified: true },
    ],
    trip_expenses: [
      { id: "ex1", departure_id: "dep1", category: "meals", amount: 8500, currency: "INR", incurred_on: "2027-06-11", notes: "Synthetic demo expense" },
    ],
    trip_incidents: [],
    trip_operations: [],
    report_runs: [
      { id: "rr1", status: "generated", started_at: iso(-1), finished_at: iso(-1), summary: { period: "daily", timezone: "Asia/Kolkata", snapshot: { newLeads: 2 }, delivered: false } },
    ],
    report_schedules: [],
    report_definitions: [],
    customer_feedback: [],
    website_pages: [
      {
        id: "wp-home",
        page_key: "home",
        title: "Home",
        status: "published",
        seo_title: "Northridge — Himalayan journeys",
        seo_description: "Published itineraries for Spiti, Manali, and Ladakh.",
        content: {
          heroHeading: "THE HIMALAYAS ARE CALLING.",
          heroSubheading: "Journeys beyond the ordinary. Experiences that stay with you.",
          heroSupporting:
            "Discover extraordinary journeys through Spiti, Ladakh and the mountains of Himachal — thoughtfully planned, personally guided and built around the way you love to travel.",
          ctaPrimary: "Explore journeys",
          ctaSecondary: "Design your journey",
        },
      },
    ],
    website_destinations: [
      { id: "d1", name: "Spiti Valley", slug: "spiti-valley", summary: "High-altitude villages, monasteries, and long Himalayan horizons.", overview: "Spiti journeys are planned around season and acclimatisation. Road and permit notes are added by the desk when verified.", status: "published", hero_image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80", highlights: [], faqs: [] },
      { id: "d2", name: "Manali", slug: "manali", summary: "A mountain gateway for weekends and longer Himalayan road trips.", overview: "Manali itineraries listed here are published packages from the catalogue.", status: "published", hero_image_url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1600&q=80", highlights: [], faqs: [] },
      { id: "d3", name: "Ladakh", slug: "ladakh", summary: "High desert roads, lakes, and paced acclimatisation.", overview: "Ladakh trips are the published packages from the operations desk. Availability is confirmed after conversation.", status: "published", hero_image_url: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1600&q=80", highlights: [], faqs: [] },
    ],
    website_articles: [
      {
        id: "g1",
        title: "How we plan a Himalayan road trip",
        slug: "how-we-plan-himalayan-road-trips",
        excerpt: "Editorial notes from the travel desk — not live weather or permit status.",
        body: "A published itinerary is a starting brief. Dates, acclimatisation, and vehicle plans are confirmed after an enquiry is reviewed in the CRM.\n\nThis article does not replace official permit rules or road-opening notices.",
        category: "Planning",
        destination_slug: "ladakh",
        status: "published",
        author_name: "Northridge travel desk",
        published_at: iso(-4),
      },
    ],
    website_testimonials: [],
    website_events: [],
    website_revisions: [],
    package_versions: [],
    permissions: [],
    role_permissions: [],
    notifications: [
      { id: "n1", profile_id: DEMO_OWNER_ID, title: "DEMO MODE", body: "Synthetic JP demonstration data. Integrations are DEMO / NOT CONNECTED. Nothing is written to a production database.", read_at: null },
    ],
    trip_enquiries: [
      { id: "te1", contact_id: "c1", lead_id: "l1", package_id: "p1", destination: "Spiti Valley", travellers: 4 },
    ],
    team_invites: [],
    package_media: [],
    lead_stage_history: [],
  } as Record<string, Array<Record<string, unknown>>>;
}

let store: Record<string, Array<Record<string, unknown>>> | null = null;

export function getDemoStore(email = "jp-demo") {
  if (!store) store = createDemoStore(email);
  return store;
}

export function resetDemoStore(email = "jp-demo") {
  store = createDemoStore(email);
  return store;
}
