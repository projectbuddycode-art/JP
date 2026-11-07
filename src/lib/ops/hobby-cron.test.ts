import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hobbyCronIssues, isHobbyCompatibleCron } from "@/lib/ops/hobby-cron";

describe("Vercel Hobby cron limits", () => {
  it("rejects every-minute and intra-day schedules", () => {
    expect(isHobbyCompatibleCron("* * * * *")).toBe(false);
    expect(isHobbyCompatibleCron("*/5 * * * *")).toBe(false);
    expect(isHobbyCompatibleCron("0 * * * *")).toBe(false);
    expect(isHobbyCompatibleCron("0 8,20 * * *")).toBe(false);
    expect(isHobbyCompatibleCron("0 8 * * *")).toBe(true);
    expect(isHobbyCompatibleCron("30 9 * * 1")).toBe(true);
  });

  it("flags the old every-minute worker", () => {
    const issues = hobbyCronIssues({
      crons: [{ path: "/api/cron/jobs", schedule: "* * * * *" }],
    });
    expect(issues.length).toBeGreaterThan(0);
  });

  it("keeps the committed vercel.json Hobby-compatible", () => {
    const vercel = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf8")) as {
      crons?: Array<{ path: string; schedule: string }>;
    };
    expect(hobbyCronIssues(vercel)).toEqual([]);
  });
});
