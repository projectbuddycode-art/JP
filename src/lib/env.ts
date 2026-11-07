import "server-only";

function optional(name: string) {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export function publicEnv() {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Northridge",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function serverEnv() {
  return {
    ...publicEnv(),
    appEnv: process.env.APP_ENV ?? "development",
    serviceRoleKey: optional("SUPABASE_SERVICE_ROLE_KEY"),
    cronSecret: optional("CRON_SECRET"),
    ownerBootstrapSecret: optional("OWNER_BOOTSTRAP_SECRET"),
    ownerBootstrapEmail: optional("OWNER_BOOTSTRAP_EMAIL")?.toLowerCase(),
    bootstrapAdminEmail: optional("BOOTSTRAP_ADMIN_EMAIL")?.toLowerCase(),
    bootstrapAdminPassword: optional("BOOTSTRAP_ADMIN_PASSWORD"),
    aiProvider: optional("AI_PROVIDER") ?? "openai",
    openaiKey: optional("OPENAI_API_KEY"),
    openaiModel: optional("OPENAI_MODEL") ?? "gpt-4o-mini",
    resendKey: optional("RESEND_API_KEY"),
    emailFrom: optional("EMAIL_FROM"),
    n8nBaseUrl: optional("N8N_BASE_URL"),
    n8nApiKey: optional("N8N_API_KEY"),
    n8nIngestWebhookUrl: optional("N8N_INGEST_WEBHOOK_URL"),
    googleAdsWebhookKey: optional("GOOGLE_ADS_WEBHOOK_KEY"),
    metaAppId: optional("META_APP_ID"),
    metaAppSecret: optional("META_APP_SECRET"),
    metaVerifyToken: optional("META_WEBHOOK_VERIFY_TOKEN"),
    whatsappAppSecret: optional("WHATSAPP_APP_SECRET"),
    whatsappVerifyToken: optional("WHATSAPP_VERIFY_TOKEN"),
    linkedinClientId: optional("LINKEDIN_CLIENT_ID"),
    linkedinClientSecret: optional("LINKEDIN_CLIENT_SECRET"),
    linkedinWebhookSecret: optional("LINKEDIN_WEBHOOK_SECRET"),
    tiktokAppSecret: optional("TIKTOK_APP_SECRET"),
    tiktokWebhookToken: optional("TIKTOK_WEBHOOK_TOKEN"),
    ingestWebhookSecret: optional("INGEST_WEBHOOK_SECRET"),
    resendWebhookSecret: optional("RESEND_WEBHOOK_SECRET"),
    sentryDsn: optional("SENTRY_DSN"),
  };
}

export function hasSupabaseConfig() {
  const env = publicEnv();
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function requireServiceRole() {
  const key = serverEnv().serviceRoleKey;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return key;
}
