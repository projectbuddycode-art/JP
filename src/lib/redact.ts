const SENSITIVE =
  /(token|secret|password|authorization|cookie|api[_-]?key|phone|email|access_token|refresh_token|wa_id)/i;

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => {
        if (SENSITIVE.test(key)) return [key, "[redacted]"];
        return [key, redact(nested)];
      }),
    );
  }
  if (typeof value === "string" && value.length > 240) {
    return `${value.slice(0, 240)}…`;
  }
  return value;
}
