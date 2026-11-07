import { redact } from "@/lib/redact";

type Level = "info" | "warn" | "error";

function emit(level: Level, message: string, extra?: Record<string, unknown>) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(extra ? { extra: redact(extra) } : {}),
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const logger = {
  info: (message: string, extra?: Record<string, unknown>) =>
    emit("info", message, extra),
  warn: (message: string, extra?: Record<string, unknown>) =>
    emit("warn", message, extra),
  error: (message: string, extra?: Record<string, unknown>) =>
    emit("error", message, extra),
};
