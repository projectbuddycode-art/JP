export const DEFAULT_TZ = "Asia/Kolkata";
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export function toIstParts(date: Date) {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    year: ist.getUTCFullYear(),
    month: ist.getUTCMonth() + 1,
    day: ist.getUTCDate(),
    hour: ist.getUTCHours(),
    minute: ist.getUTCMinutes(),
    weekday: ist.getUTCDay(),
  };
}

export function fromIstWall(year: number, month: number, day: number, hour: number, minute: number) {
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - IST_OFFSET_MS);
}

export function istDateKey(date = new Date()) {
  const parts = toIstParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function formatIst(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: DEFAULT_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function istHour(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: DEFAULT_TZ,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Number(parts.find((part) => part.type === "hour")?.value ?? "0");
}

export function inIstRange(iso: string | null | undefined, from: string, to: string) {
  if (!iso) return false;
  const key = istDateKey(new Date(iso));
  return key >= from && key <= to;
}

export function hourBucket(hour: number) {
  if (hour < 6) return "00:00–05:59";
  if (hour < 9) return "06:00–08:59";
  if (hour < 12) return "09:00–11:59";
  if (hour < 15) return "12:00–14:59";
  if (hour < 18) return "15:00–17:59";
  if (hour < 21) return "18:00–20:59";
  return "21:00–23:59";
}

export function rangeUtc(fromDate: string, toDate: string, tz = DEFAULT_TZ) {
  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T23:59:59.999`);
  const offsetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "shortOffset",
  });
  void offsetFormatter;
  return { start: start.toISOString(), end: end.toISOString() };
}

export function firstResponseMinutes(createdAt: string | null, firstResponseAt: string | null) {
  if (!createdAt || !firstResponseAt) return null;
  return Math.max(0, Math.round((new Date(firstResponseAt).getTime() - new Date(createdAt).getTime()) / 60000));
}
