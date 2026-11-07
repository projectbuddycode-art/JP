export type IntegrationCapability =
  | "lead_forms"
  | "messaging"
  | "publishing"
  | "webhooks"
  | "oauth"
  | "csv"
  | "first_party";

export type ProviderCapabilityDoc = {
  id: string;
  title: string;
  captures: string;
  cannotCapture: string;
  accountType: string;
  developerAccess: string;
  permissions: string[];
  credentials: string[];
  webhookPath: string | null;
  setup: string[];
  testMethod: string;
  limitations: string;
  recovery: string;
  capabilities: IntegrationCapability[];
};

export const PROVIDER_CATALOG: ProviderCapabilityDoc[] = [
  {
    id: "website_form",
    title: "Website forms",
    captures: "Public enquiry, custom-trip, contact and trip forms with UTMs, landing page and consent.",
    cannotCapture: "Calls that never reach the website. Newsletter sign-ups are stored as events, not sales leads.",
    accountType: "This application",
    developerAccess: "None",
    permissions: [],
    credentials: [],
    webhookPath: null,
    setup: ["Publish packages", "Share /enquire, /contact or trip pages", "Submit a test enquiry"],
    testMethod: "Submit the public enquiry form. The lead must appear in Enquiries.",
    limitations: "Spam protection is rate-limiting plus required consent, not a third-party CAPTCHA.",
    recovery: "Resubmit. Duplicate browser retries with a new event id create a new enquiry for the same contact.",
    capabilities: ["lead_forms", "first_party"],
  },
  {
    id: "meta_lead_ads",
    title: "Meta Lead Ads",
    captures: "Facebook/Instagram lead forms via Graph leadgen webhooks and lead retrieval.",
    cannotCapture: "Page visitors, Reel viewers, follower lists, or phone numbers not submitted on the form.",
    accountType: "Meta Business + Page + lead form",
    developerAccess: "Meta app with Advanced Access for leads_retrieval in production.",
    permissions: ["pages_show_list", "leads_retrieval", "pages_manage_ads", "pages_read_engagement"],
    credentials: ["META_APP_ID", "META_APP_SECRET", "META_WEBHOOK_VERIFY_TOKEN", "Page token"],
    webhookPath: "/api/webhooks/meta",
    setup: [
      "Create a Meta app and add the Webhooks and Lead Ads products.",
      "Set the verify token and subscribe the Page to leadgen.",
      "Connect OAuth from this screen, then Test connection.",
      "Send a test lead from Lead Center.",
    ],
    testMethod: "Meta test lead. Connection stays pending until a signed webhook is processed with retrieved fields.",
    limitations: "Webhook notices without a Page token stay as pending_fields until retrieval succeeds.",
    recovery: "Use Graph GET /{leadgen_id} backfill when a Page token is stored. Retry the event from Delivery Monitor.",
    capabilities: ["lead_forms", "webhooks", "oauth"],
  },
  {
    id: "instagram_messaging",
    title: "Instagram messaging",
    captures: "Supported Instagram professional DMs and comment webhooks on connected Pages.",
    cannotCapture: "Scraped followers, story viewers, or private profile data.",
    accountType: "Instagram professional account linked to a Facebook Page",
    developerAccess: "instagram_manage_messages App Review for production messaging.",
    permissions: ["instagram_basic", "instagram_manage_messages", "pages_manage_metadata"],
    credentials: ["Same Meta app as Lead Ads", "Page token", "IG user id"],
    webhookPath: "/api/webhooks/meta",
    setup: ["Connect Meta", "Subscribe messages and comments", "Do not treat every comment as a lead"],
    testMethod: "Send a DM that includes a trip question. Comments classified as general/spam do not create leads.",
    limitations: "Human takeover and 24-hour messaging windows apply.",
    recovery: "Replay the stored webhook payload from Delivery Monitor.",
    capabilities: ["messaging", "webhooks", "oauth"],
  },
  {
    id: "meta_social",
    title: "Instagram & Facebook publishing",
    captures: "Authorized publish results and provider post ids from Social Media Studio.",
    cannotCapture: "Insights that the token cannot read. No unofficial scraping.",
    accountType: "Facebook Page + Instagram professional",
    developerAccess: "pages_manage_posts / instagram_content_publish App Review for live posting.",
    permissions: ["pages_manage_posts", "instagram_content_publish", "instagram_basic"],
    credentials: ["Page access token", "Page id", "IG user id"],
    webhookPath: null,
    setup: ["OAuth or paste Page token server-side", "Test connection", "Publish from Social Studio"],
    testMethod: "Publish or schedule a post. Status stays pending until Graph accepts it.",
    limitations: "Reels follow current Graph media rules; unsupported containers fail with the provider error.",
    recovery: "Reconnect before token expiry. Retry failed publishes from the job queue.",
    capabilities: ["publishing", "oauth"],
  },
  {
    id: "whatsapp",
    title: "WhatsApp Business Platform",
    captures: "Inbound Cloud API messages, statuses, and enquiry leads when the text is a genuine trip question.",
    cannotCapture: "Personal WhatsApp, unofficial multi-device sessions, or marketing sends without eligibility.",
    accountType: "WhatsApp Business Cloud API number",
    developerAccess: "Meta app + WhatsApp product. Existing numbers may not be eligible for every onboarding path.",
    permissions: ["whatsapp_business_messaging", "whatsapp_business_management"],
    credentials: ["WHATSAPP_APP_SECRET", "WHATSAPP_VERIFY_TOKEN", "access token", "phone number id"],
    webhookPath: "/api/webhooks/whatsapp",
    setup: ["Store Cloud API token and phone number id", "Verify webhook", "Test inbound message"],
    testMethod: "Send an inbound message. A new lead is created only for a genuine enquiry, not every ping.",
    limitations: "Template, 24-hour window, opt-out and suppression rules are enforced before send.",
    recovery: "Idempotent on provider_message_id. Retry failed outbound jobs without duplicating inbound leads.",
    capabilities: ["messaging", "webhooks"],
  },
  {
    id: "google_ads",
    title: "Google Ads lead forms",
    captures: "Official lead-form webhook fields, campaign/form ids, gclid and test flag.",
    cannotCapture: "Search query text or conversions that Google does not include on the webhook.",
    accountType: "Google Ads account with lead form extensions",
    developerAccess: "Webhook key configured in Google Ads. No Ads API developer token required for the webhook path.",
    permissions: [],
    credentials: ["GOOGLE_ADS_WEBHOOK_KEY or stored webhook key"],
    webhookPath: "/api/webhooks/google-ads",
    setup: [
      "In Google Ads, open the lead form asset webhook.",
      "Paste the webhook URL and the same google_key stored here.",
      "Send a Google test lead.",
    ],
    testMethod: "POST a signed test payload. is_test leads are stored with the test badge.",
    limitations: "Unknown optional columns are kept in metadata and ignored for mapping.",
    recovery: "Google retries; CRM dedupes on lead_id. Retry from Delivery Monitor if processing failed after 200.",
    capabilities: ["lead_forms", "webhooks"],
  },
  {
    id: "linkedin",
    title: "LinkedIn Lead Gen",
    captures: "Lead Sync payloads when the app is approved: lead id, form, campaign, submitted fields.",
    cannotCapture: "Ordinary Advertising API access does not grant lead retrieval.",
    accountType: "LinkedIn Campaign Manager + organization",
    developerAccess: "LinkedIn Lead Sync / r_ads_leadgen_automation program approval.",
    permissions: ["r_ads_leadgen_automation"],
    credentials: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "LINKEDIN_WEBHOOK_SECRET"],
    webhookPath: "/api/webhooks/linkedin",
    setup: ["Apply for Lead Sync", "Set OAuth redirect", "Do not mark Connected until a real lead is retrieved"],
    testMethod: "BLOCKED until LinkedIn approves the app. Adapter accepts authenticated test JSON for mapping only.",
    limitations: "Shows Awaiting approval until developer access exists. No simulated connection.",
    recovery: "Historical backfill only after Lead Sync APIs are authorized.",
    capabilities: ["lead_forms", "oauth", "webhooks"],
  },
  {
    id: "tiktok",
    title: "TikTok Lead Generation",
    captures: "Official lead webhook fields when the advertiser app can subscribe to leads.",
    cannotCapture: "Organic video comments unless a separate authorized webhook exists.",
    accountType: "TikTok Ads Manager + approved Marketing API app",
    developerAccess: "TikTok developer app with lead permission.",
    permissions: ["lead.webhook"],
    credentials: ["TIKTOK_APP_SECRET", "TIKTOK_WEBHOOK_TOKEN"],
    webhookPath: "/api/webhooks/tiktok",
    setup: ["Create a TikTok app", "Set the webhook URL", "Subscribe lead events"],
    testMethod: "BLOCKED without app credentials. Mapping is unit-tested with sample payloads.",
    limitations: "Direct CRM connectors may require TikTok partner status in some regions.",
    recovery: "Dedupes on lead_id. Retry failed processing from Delivery Monitor.",
    capabilities: ["lead_forms", "webhooks"],
  },
  {
    id: "google_business",
    title: "Google Business tracking",
    captures: "UTM-tagged landing pages, website forms, tracked WhatsApp links, and manual call logs marked as GBP.",
    cannotCapture: "Every phone call placed from the Google listing. GBP is not a universal lead-export API.",
    accountType: "Google Business Profile",
    developerAccess: "Optional Business Messages if Google enables it for the listing — not assumed.",
    permissions: [],
    credentials: [],
    webhookPath: null,
    setup: ["Use UTM links on the profile", "Point buttons at /enquire", "Log calls manually when needed"],
    testMethod: "Open the tracked link and submit the website form with utm_source=google_business.",
    limitations: "No automatic retrieval of missed calls.",
    recovery: "Manual call-to-lead form with source Google Business Profile.",
    capabilities: ["first_party"],
  },
  {
    id: "email",
    title: "Email enquiries",
    captures: "Authorized inbound webhooks (Resend or generic): from, subject, body, message id.",
    cannotCapture: "Mailbox scraping or unauthenticated forwarding.",
    accountType: "Email provider with inbound webhooks",
    developerAccess: "Provider webhook signing.",
    permissions: [],
    credentials: ["RESEND_WEBHOOK_SECRET or INGEST_WEBHOOK_SECRET", "EMAIL_FROM for outbound"],
    webhookPath: "/api/webhooks/email",
    setup: ["Configure inbound webhook", "Share the secret only on the server", "Send a test enquiry email"],
    testMethod: "Inbound payload with a travel subject creates a lead. Thread replies are not new leads.",
    limitations: "Spam that does not look like a trip enquiry is stored as ignored, not a qualified lead.",
    recovery: "Idempotent on message id.",
    capabilities: ["webhooks"],
  },
  {
    id: "n8n",
    title: "n8n",
    captures: "Scheduled CRM ticks (reports, reminders, due jobs) plus optional outbound ingest webhook.",
    cannotCapture: "An embedded editor. Credentials never go to the browser.",
    accountType: "Self-hosted or n8n Cloud",
    developerAccess: "API key with workflow scope",
    permissions: [],
    credentials: ["N8N_BASE_URL", "N8N_API_KEY", "optional N8N_INGEST_WEBHOOK_URL"],
    webhookPath: null,
    setup: ["Set server env", "Test from Automation Center", "CRM remains source of truth"],
    testMethod: "Test n8n API. Connected only when /api/v1/workflows succeeds.",
    limitations: "If n8n is down, scheduled ticks pause and jobs remain pending in Postgres. Website/Meta/WhatsApp/Google Ads leads still save immediately.",
    recovery: "Inspect automation_executions and n8n execution logs separately.",
    capabilities: ["webhooks"],
  },
  {
    id: "custom_webhook",
    title: "Custom webhooks / API",
    captures: "Authenticated JSON enquiries from third-party forms.",
    cannotCapture: "Unauthenticated posts. Arbitrary URLs cannot write to the CRM.",
    accountType: "Any system that can HMAC or bearer-auth",
    developerAccess: "Shared secret",
    permissions: ["ingest_secret"],
    credentials: ["INGEST_WEBHOOK_SECRET"],
    webhookPath: "/api/webhooks/custom",
    setup: ["Set INGEST_WEBHOOK_SECRET", "POST JSON with event_id and contact", "Map fields in the payload"],
    testMethod: "POST with Authorization: Bearer <secret>. Invalid signatures return 401.",
    limitations: "Rate limited. Unknown fields are stored in ingest_metadata.",
    recovery: "Idempotent on provider+event_id.",
    capabilities: ["webhooks"],
  },
  {
    id: "csv_import",
    title: "CSV import",
    captures: "Mapped name, phone, email, destination, source, travellers, budget.",
    cannotCapture: "Identity documents. Name-only rows without phone/email are rejected.",
    accountType: "Workspace users with lead create",
    developerAccess: "None",
    permissions: ["leads.create"],
    credentials: [],
    webhookPath: null,
    setup: ["Open Enquiries → New lead / CSV import", "Preview failures in the import report"],
    testMethod: "Import a two-row file: one new, one existing phone. Existing contact gets a new enquiry.",
    limitations: "No silent merge on name match.",
    recovery: "Failed rows are listed; successful rows are audited.",
    capabilities: ["csv"],
  },
];

export function displayConnectionStatus(input: {
  provider: string;
  status: string;
  last_error?: string | null;
  authorization_status?: string | null;
  last_success_at?: string | null;
}) {
  if (input.authorization_status === "developer_access_required") return "Awaiting Approval";
  if (input.status === "connected" && input.last_success_at) return "Connected";
  if (input.status === "connected") return "Connected";
  if (input.status === "error") return "Error";
  if (input.status === "expired") return "Disconnected";
  if (input.status === "pending") return "Configuration Required";
  return "Not Connected";
}
