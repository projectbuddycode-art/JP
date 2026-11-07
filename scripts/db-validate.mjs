import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "supabase", "migrations");
const sql = readdirSync(dir)
  .filter((file) => file.endsWith(".sql"))
  .map((file) => readFileSync(join(dir, file), "utf8"))
  .join("\n");

const required = [
  "profiles",
  "workspace_settings",
  "contacts",
  "leads",
  "lead_stage_history",
  "packages",
  "package_media",
  "trip_enquiries",
  "bookings",
  "proposals",
  "proposal_items",
  "activities",
  "tasks",
  "conversations",
  "messages",
  "message_templates",
  "consent_records",
  "suppression_list",
  "campaigns",
  "campaign_attribution",
  "social_accounts",
  "social_posts",
  "social_post_platforms",
  "social_metrics",
  "automation_workflows",
  "automation_executions",
  "jobs",
  "integration_connections",
  "integration_events",
  "audit_logs",
  "notifications",
  "enable row level security",
  "claim_first_owner",
  "workspace_role",
  "bootstrap_state",
  "login_events",
  "lead_assignment_history",
  "report_definitions",
  "report_schedules",
  "report_runs",
  "approvals",
  "suppliers",
  "trip_operations",
  "website_pages",
  "website_destinations",
  "website_articles",
  "website_testimonials",
  "package_versions",
  "departures",
  "departure_travellers",
  "itinerary_days",
  "departure_suppliers",
  "booking_payments",
  "departure_checklist",
  "integration_event_attempts",
  "lead_source_events",
  "lead_field_values",
  "webhook_subscriptions",
  "provider_sync_cursors",
  "operations_manager",
  "automation_schedules",
  "rate_limit_buckets",
  "hit_rate_limit",
  "can_view_financial_records",
];

const missing = required.filter((item) => !sql.toLowerCase().includes(item.toLowerCase()));
if (missing.length) {
  console.error("Database validation failed. Missing:", missing.join(", "));
  process.exit(1);
}
if (!sql.includes("integration_secrets")) {
  console.error("integration_secrets table missing");
  process.exit(1);
}
console.log("Database validation passed: required entities and RLS markers are present.");
