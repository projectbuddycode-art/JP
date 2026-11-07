import { fromIstWall, istDateKey, toIstParts } from "@/lib/reports/timezone";
import type { JobType } from "@/lib/jobs/types";

export type ScheduleCadence =
  | "every_5m"
  | "every_15m"
  | "daily_08"
  | "daily_09"
  | "daily_0930"
  | "daily_10"
  | "daily_1030"
  | "weekly_mon_08"
  | "monthly_1_08";

export type ScheduleDefinition = {
  key: string;
  name: string;
  cadence: ScheduleCadence;
  jobType: JobType;
  n8nCron: string;
  description: string;
};

export const AUTOMATION_SCHEDULES: ScheduleDefinition[] = [
  {
    key: "jobs.process",
    name: "Due job worker",
    cadence: "every_5m",
    jobType: "jobs.process",
    n8nCron: "*/5 * * * *",
    description: "Claims due Postgres jobs (WhatsApp, social publish, workflow waits, retries). Replaces the former Vercel every-minute cron.",
  },
  {
    key: "followup.scan",
    name: "Lead follow-up reminders",
    cadence: "every_15m",
    jobType: "followup.scan",
    n8nCron: "*/15 * * * *",
    description: "Notifies assignees of overdue follow-up tasks from the CRM task table.",
  },
  {
    key: "report.daily",
    name: "Daily management report",
    cadence: "daily_08",
    jobType: "report.daily",
    n8nCron: "0 8 * * *",
    description: "Writes a same-day IST snapshot of leads, bookings, and cash collected.",
  },
  {
    key: "report.weekly",
    name: "Weekly partner report",
    cadence: "weekly_mon_08",
    jobType: "report.weekly",
    n8nCron: "0 8 * * 1",
    description: "Monday 08:00 IST snapshot of the previous seven days.",
  },
  {
    key: "report.monthly",
    name: "Monthly management report",
    cadence: "monthly_1_08",
    jobType: "report.monthly",
    n8nCron: "0 8 1 * *",
    description: "First of month 08:00 IST snapshot of the previous calendar month.",
  },
  {
    key: "payments.remind",
    name: "Payment due reminders",
    cadence: "daily_09",
    jobType: "payments.remind",
    n8nCron: "0 9 * * *",
    description: "Alerts finance/owners about confirmed bookings with outstanding customer balances.",
  },
  {
    key: "departures.alert",
    name: "Upcoming departure alerts",
    cadence: "daily_0930",
    jobType: "departures.alert",
    n8nCron: "30 9 * * *",
    description: "Alerts operations about departures starting within seven days.",
  },
  {
    key: "documents.remind",
    name: "Traveller document reminders",
    cadence: "daily_10",
    jobType: "documents.remind",
    n8nCron: "0 10 * * *",
    description: "Lists travellers whose document_status is still pending on upcoming departures.",
  },
  {
    key: "suppliers.remind",
    name: "Supplier confirmation reminders",
    cadence: "daily_1030",
    jobType: "suppliers.remind",
    n8nCron: "30 10 * * *",
    description: "Lists departure supplier rows that are not confirmed.",
  },
  {
    key: "social.publish",
    name: "Social media publishing",
    cadence: "every_5m",
    jobType: "jobs.process",
    n8nCron: "*/5 * * * *",
    description: "Relies on the due job worker to publish posts whose scheduled_for has arrived. Does not invent publish success.",
  },
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function scheduleWindowKey(cadence: ScheduleCadence, now = new Date()) {
  const date = istDateKey(now);
  const parts = toIstParts(now);
  if (cadence === "every_5m") {
    const minute = Math.floor(parts.minute / 5) * 5;
    return `${date}T${pad(parts.hour)}:${pad(minute)}`;
  }
  if (cadence === "every_15m") {
    const minute = Math.floor(parts.minute / 15) * 15;
    return `${date}T${pad(parts.hour)}:${pad(minute)}`;
  }
  if (cadence === "weekly_mon_08") {
    const utc = Date.UTC(parts.year, parts.month - 1, parts.day);
    const week = new Date(utc);
    const thursday = new Date(week);
    thursday.setUTCDate(week.getUTCDate() + ((4 - (week.getUTCDay() || 7)) % 7));
    const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${thursday.getUTCFullYear()}-W${pad(weekNo)}`;
  }
  if (cadence === "monthly_1_08") {
    return `${parts.year}-${pad(parts.month)}`;
  }
  return date;
}

export function nextRunAt(cadence: ScheduleCadence, from = new Date()) {
  const parts = toIstParts(from);
  if (cadence === "every_5m") return new Date(from.getTime() + 5 * 60_000);
  if (cadence === "every_15m") return new Date(from.getTime() + 15 * 60_000);

  const daily = (hour: number, minute: number) => {
    let candidate = fromIstWall(parts.year, parts.month, parts.day, hour, minute);
    if (candidate.getTime() <= from.getTime()) {
      candidate = new Date(candidate.getTime() + 86_400_000);
    }
    return candidate;
  };

  if (cadence === "daily_08") return daily(8, 0);
  if (cadence === "daily_09") return daily(9, 0);
  if (cadence === "daily_0930") return daily(9, 30);
  if (cadence === "daily_10") return daily(10, 0);
  if (cadence === "daily_1030") return daily(10, 30);

  if (cadence === "weekly_mon_08") {
    let candidate = daily(8, 0);
    while (toIstParts(candidate).weekday !== 1) {
      candidate = new Date(candidate.getTime() + 86_400_000);
    }
    return candidate;
  }

  let monthStart = fromIstWall(parts.year, parts.month, 1, 8, 0);
  if (monthStart.getTime() <= from.getTime()) {
    const month = parts.month === 12 ? 1 : parts.month + 1;
    const year = parts.month === 12 ? parts.year + 1 : parts.year;
    monthStart = fromIstWall(year, month, 1, 8, 0);
  }
  return monthStart;
}

export function scheduleByKey(key: string) {
  return AUTOMATION_SCHEDULES.find((item) => item.key === key) ?? null;
}
