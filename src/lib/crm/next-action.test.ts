import { describe, expect, it } from "vitest";
import { suggestNextAction } from "@/lib/crm/next-action";

describe("suggestNextAction", () => {
  it("prioritises overdue follow-up", () => {
    const result = suggestNextAction({
      stageSlug: "contacted",
      hasPhone: true,
      hasEmail: true,
      lastInteractionAt: new Date().toISOString(),
      nextFollowUpAt: new Date(Date.now() - 3600_000).toISOString(),
      hasQuote: false,
      missingFields: [],
      consentMarketing: true,
      staleDays: 1,
      isLost: false,
      isWon: false,
    });
    expect(result.intent).toBe("high");
    expect(result.action).toMatch(/overdue/i);
  });

  it("does not invent a close for lost leads", () => {
    const result = suggestNextAction({
      stageSlug: "lost",
      hasPhone: true,
      hasEmail: true,
      lastInteractionAt: null,
      nextFollowUpAt: null,
      hasQuote: false,
      missingFields: [],
      consentMarketing: false,
      staleDays: 40,
      isLost: true,
      isWon: false,
    });
    expect(result.action).toMatch(/lost reason/i);
  });
});
