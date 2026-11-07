/** Vercel Hobby: at most two crons, and none more often than once per day. */

export type VercelCron = { path?: string; schedule?: string };

export function isHobbyCompatibleCron(expression: string) {
  const parts = expression.trim().split(/\s+/);
  if (parts.length < 5) return false;
  const [minute, hour] = parts;
  const hasStepOrWildcard = (field: string) => field.includes("*") || field.includes("/") || field.includes(",") || field.includes("-");
  if (hasStepOrWildcard(minute) || hasStepOrWildcard(hour)) return false;
  if (!/^\d+$/.test(minute) || !/^\d+$/.test(hour)) return false;
  const minuteNum = Number(minute);
  const hourNum = Number(hour);
  return minuteNum >= 0 && minuteNum <= 59 && hourNum >= 0 && hourNum <= 23;
}

export function hobbyCronIssues(config: { crons?: VercelCron[] } | null | undefined) {
  const crons = config?.crons ?? [];
  const issues: string[] = [];
  if (crons.length > 2) {
    issues.push(`Hobby allows at most 2 cron jobs; found ${crons.length}`);
  }
  for (const cron of crons) {
    const schedule = cron.schedule ?? "";
    const path = cron.path ?? "(unknown)";
    if (!isHobbyCompatibleCron(schedule)) {
      issues.push(`${path} uses "${schedule}", which is more frequent than once per day (Hobby limit)`);
    }
  }
  return issues;
}
