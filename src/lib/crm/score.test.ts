import { describe, expect, it } from "vitest";
import { scoreLead } from "@/lib/crm/score";

describe("transparent lead scoring", () => {
  it("adds only documented field points", () => {
    const result = scoreLead({
      hasPhone: true,
      hasEmail: true,
      destination: "Spiti Valley",
      preferredStart: "2027-06-10",
      travellers: 4,
      budget: 180000,
      source: "website",
      stageProbability: 0.5,
    });
    expect(result.score).toBe(100);
    expect(result.reasons.length).toBeGreaterThan(3);
  });

  it("zeros lost leads", () => {
    expect(scoreLead({ hasPhone: true, hasEmail: true, isLost: true }).score).toBe(0);
  });
});
