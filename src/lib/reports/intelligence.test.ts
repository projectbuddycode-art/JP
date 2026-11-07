import { describe, expect, it } from "vitest";
import { buildLeadRegister, hourlyAnalysis, managementSnapshot } from "@/lib/reports/intelligence";

const lead = (id: string, received: string, extra: Record<string, unknown> = {}) => ({
  id,
  full_name: id,
  created_at: received,
  received_at: received,
  is_test: false,
  ...extra,
});

describe("reporting intelligence", () => {
  it("counts leads received in the window and ignores tests", () => {
    const rows = buildLeadRegister(
      [
        lead("a", "2026-11-07T04:00:00.000Z"),
        lead("b", "2026-11-01T04:00:00.000Z"),
        lead("c", "2026-11-07T05:00:00.000Z", { is_test: true }),
      ],
      "2026-11-07",
      "2026-11-07",
    );
    expect(rows.map((item) => item.id)).toEqual(["a"]);
  });

  it("uses Asia/Kolkata calendar dates, not UTC midnight", () => {
    const afterIstMidnight = lead("late", "2026-11-07T18:40:00.000Z");
    const rows = buildLeadRegister([afterIstMidnight], "2026-11-07", "2026-11-07");
    expect(rows.map((item) => item.id)).toEqual([]);
  });

  it("does not treat cancelled bookings as confirmed revenue", () => {
    const snap = managementSnapshot(
      [lead("a", "2026-11-07T04:00:00.000Z")],
      [
        { id: "1", booking_status: "confirmed", confirmed_amount: 100000, amount_received: 20000, created_at: "2026-11-07" },
        { id: "2", booking_status: "cancelled", confirmed_amount: 90000, amount_received: 0, created_at: "2026-11-07" },
      ],
      [],
    );
    expect(snap.confirmed).toBe(1);
    expect(snap.cancelled).toBe(1);
    expect(snap.recordedRevenue).toBe(100000);
    expect(snap.cashReceived).toBe(20000);
  });

  it("buckets arrival hours in IST", () => {
    const buckets = hourlyAnalysis([lead("a", "2026-11-07T04:30:00.000Z")]);
    expect(Object.values(buckets).reduce((sum, n) => sum + n, 0)).toBe(1);
  });
});
