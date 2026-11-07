import { describe, expect, it } from "vitest";
import { redact } from "@/lib/redact";

describe("redact", () => {
  it("removes tokens and phones from logs", () => {
    const result = redact({ access_token: "secret", phone: "+91", nested: { api_key: "x" } }) as Record<string, unknown>;
    expect(result.access_token).toBe("[redacted]");
    expect(result.phone).toBe("[redacted]");
  });
});
