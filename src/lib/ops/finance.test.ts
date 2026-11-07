import { describe, expect, it } from "vitest";
import { tripProfitability } from "@/lib/ops/finance";
import { readinessStatus } from "@/lib/ops/readiness";

describe("trip profitability", () => {
  it("does not treat confirmed booking value as cash collected", () => {
    const result = tripProfitability({
      bookings: [{ confirmed_amount: 100000, amount_received: 20000, booking_status: "confirmed" }],
      payments: [{ amount: 20000 }],
      supplierCosts: [{ agreed_cost: 40000, advance_paid: 10000 }],
      expenses: [{ amount: 5000 }],
    });
    expect(result.bookingValue).toBe(100000);
    expect(result.collected).toBe(20000);
    expect(result.outstanding).toBe(80000);
    expect(result.actualCosts).toBe(15000);
    expect(result.actualProfit).toBe(5000);
  });
});

describe("readiness", () => {
  it("never marks ready if a critical item is open", () => {
    expect(
      readinessStatus([
        { key: "trip_leader", critical: true, completed: true },
        { key: "hotel_confirmed", critical: true, completed: false },
      ]),
    ).toBe("needs_attention");
  });
});
