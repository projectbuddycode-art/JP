import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
const crons = vercel.crons ?? [];

function isHobbyCompatibleCron(expression) {
  const parts = String(expression).trim().split(/\s+/);
  if (parts.length < 5) return false;
  const [minute, hour] = parts;
  const bad = (field) => field.includes("*") || field.includes("/") || field.includes(",") || field.includes("-");
  return !bad(minute) && !bad(hour) && /^\d+$/.test(minute) && /^\d+$/.test(hour);
}

const issues = [];
if (crons.length > 2) issues.push(`Hobby allows at most 2 cron jobs; found ${crons.length}`);
for (const cron of crons) {
  if (!isHobbyCompatibleCron(cron.schedule ?? "")) {
    issues.push(`${cron.path} schedule "${cron.schedule}" is not Hobby-compatible (must be at most once per day)`);
  }
}
if (issues.length) {
  console.error("Vercel Hobby check failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}
console.log(`Vercel Hobby check passed: ${crons.length} cron job(s) in vercel.json`);
