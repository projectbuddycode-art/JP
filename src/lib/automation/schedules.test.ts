import { describe, expect, it } from "vitest";
import { AUTOMATION_SCHEDULES, nextRunAt, scheduleWindowKey } from "@/lib/automation/schedules";

describe("automation schedules", () => {
  it("covers the migrated Vercel worker plus named n8n workflows", () => {
    const keys = AUTOMATION_SCHEDULES.map((item) => item.key);
    expect(keys).toContain("jobs.process");
    expect(keys).toContain("followup.scan");
    expect(keys).toContain("report.daily");
    expect(keys).toContain("social.publish");
  });

  it("uses Asia/Kolkata windows for idempotency", () => {
    const nineThirtyIst = new Date("2026-11-07T04:00:00.000Z");
    expect(scheduleWindowKey("daily_08", nineThirtyIst)).toBe("2026-11-07");
    expect(scheduleWindowKey("every_15m", nineThirtyIst)).toBe("2026-11-07T09:30");
  });

  it("computes the next 08:00 IST after morning", () => {
    const nineThirtyIst = new Date("2026-11-07T04:00:00.000Z");
    const next = nextRunAt("daily_08", nineThirtyIst);
    expect(next.toISOString()).toBe("2026-11-08T02:30:00.000Z");
  });
});
