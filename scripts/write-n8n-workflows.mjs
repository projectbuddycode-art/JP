import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "n8n", "workflows");
mkdirSync(dir, { recursive: true });

const workflows = [
  ["northridge-job-worker", "Northridge — Due job worker", "*/5 * * * *", { action: "process_due_jobs" }],
  ["northridge-followups", "Northridge — Lead follow-up reminders", "*/15 * * * *", { action: "run_schedule", scheduleKey: "followup.scan" }],
  ["northridge-report-daily", "Northridge — Daily management report", "0 8 * * *", { action: "run_schedule", scheduleKey: "report.daily" }],
  ["northridge-report-weekly", "Northridge — Weekly partner report", "0 8 * * 1", { action: "run_schedule", scheduleKey: "report.weekly" }],
  ["northridge-report-monthly", "Northridge — Monthly management report", "0 8 1 * *", { action: "run_schedule", scheduleKey: "report.monthly" }],
  ["northridge-payments", "Northridge — Payment due reminders", "0 9 * * *", { action: "run_schedule", scheduleKey: "payments.remind" }],
  ["northridge-departures", "Northridge — Upcoming departure alerts", "30 9 * * *", { action: "run_schedule", scheduleKey: "departures.alert" }],
  ["northridge-documents", "Northridge — Traveller document reminders", "0 10 * * *", { action: "run_schedule", scheduleKey: "documents.remind" }],
  ["northridge-suppliers", "Northridge — Supplier confirmation reminders", "30 10 * * *", { action: "run_schedule", scheduleKey: "suppliers.remind" }],
  ["northridge-social", "Northridge — Social media publishing", "*/5 * * * *", { action: "run_schedule", scheduleKey: "social.publish" }],
];

function build(name, cron, body) {
  return {
    name,
    nodes: [
      {
        parameters: {
          rule: { interval: [{ field: "cronExpression", expression: cron }] },
        },
        id: "schedule",
        name: "Schedule Trigger",
        type: "n8n-nodes-base.scheduleTrigger",
        typeVersion: 1.2,
        position: [0, 0],
      },
      {
        parameters: {
          method: "POST",
          url: "={{$env.CRM_BASE_URL}}/api/automation/tick",
          sendHeaders: true,
          headerParameters: {
            parameters: [{ name: "Authorization", value: "=Bearer {{$env.CRM_CRON_SECRET}}" }],
          },
          sendBody: true,
          specifyBody: "json",
          jsonBody: JSON.stringify(body),
          options: { timeout: 25000 },
        },
        id: "http",
        name: "CRM tick",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [280, 0],
      },
    ],
    connections: {
      "Schedule Trigger": {
        main: [[{ node: "CRM tick", type: "main", index: 0 }]],
      },
    },
    settings: { timezone: "Asia/Kolkata", executionTimeout: 60 },
    meta: { description: "Northridge CRM schedule. Timezone Asia/Kolkata. Auth uses CRM_CRON_SECRET." },
  };
}

for (const [file, name, cron, body] of workflows) {
  writeFileSync(join(dir, `${file}.json`), `${JSON.stringify(build(name, cron, body), null, 2)}\n`);
}
console.log(`Wrote ${workflows.length} n8n workflow templates`);
