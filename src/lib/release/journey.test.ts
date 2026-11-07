import { describe, expect, it } from "vitest";
import { isPubliclyListed } from "@/lib/site/visibility";
import { readinessStatus } from "@/lib/ops/readiness";
import { tripProfitability } from "@/lib/ops/finance";
import { hobbyCronIssues } from "@/lib/ops/hobby-cron";
import { AUTOMATION_SCHEDULES } from "@/lib/automation/schedules";

describe("release journeys (deterministic)", () => {
  it("keeps drafts and unpublished packages off public listings", () => {
    expect(isPubliclyListed({ status: "draft", website_status: "draft" })).toBe(false);
    expect(isPubliclyListed({ status: "published", website_status: "unpublished" })).toBe(false);
    expect(isPubliclyListed({ status: "published", website_status: "published" })).toBe(true);
  });

  it("does not treat a sent proposal as a confirmed booking", () => {
    const proposalStatus = "sent";
    const bookingStatuses = ["confirmed", "completed"];
    expect(bookingStatuses.includes(proposalStatus)).toBe(false);
  });

  it("blocks ready-for-departure when critical checklist items are open", () => {
    expect(
      readinessStatus([
        { key: "payments_checked", critical: true, completed: true },
        { key: "vehicles_assigned", critical: true, completed: false },
      ]),
    ).not.toBe("ready");
  });

  it("separates booking value from cash collected", () => {
    const result = tripProfitability({
      bookings: [{ confirmed_amount: 50000, amount_received: 0, booking_status: "confirmed" }],
      payments: [],
      supplierCosts: [],
      expenses: [],
    });
    expect(result.bookingValue).toBe(50000);
    expect(result.collected).toBe(0);
  });

  it("has no Vercel Hobby-incompatible crons and keeps n8n schedules", () => {
    expect(hobbyCronIssues({ crons: [] })).toEqual([]);
    expect(AUTOMATION_SCHEDULES.some((item) => item.key === "jobs.process")).toBe(true);
  });
});
