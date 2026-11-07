import { describe, expect, it } from "vitest";
import { canSendWhatsApp, isOptOutText, withinCustomerServiceWindow } from "@/lib/whatsapp/eligibility";

describe("WhatsApp eligibility", () => {
  it("blocks marketing without opt-in", () => {
    const result = canSendWhatsApp({
      connected: true,
      messageKind: "marketing",
      consent: { marketingOptIn: false, transactionalAllowed: true, suppressed: false },
      window: { lastCustomerMessageAt: new Date().toISOString() },
      humanTakeover: false,
    });
    expect(result.allowed).toBe(false);
  });

  it("blocks session messages outside the 24h window", () => {
    const result = canSendWhatsApp({
      connected: true,
      messageKind: "session",
      consent: { marketingOptIn: true, transactionalAllowed: true, suppressed: false },
      window: { lastCustomerMessageAt: new Date(Date.now() - 25 * 3600_000).toISOString() },
      humanTakeover: false,
    });
    expect(result.allowed).toBe(false);
  });

  it("allows session messages inside the window", () => {
    expect(withinCustomerServiceWindow({ lastCustomerMessageAt: new Date().toISOString() })).toBe(true);
    const result = canSendWhatsApp({
      connected: true,
      messageKind: "session",
      consent: { marketingOptIn: true, transactionalAllowed: true, suppressed: false },
      window: { lastCustomerMessageAt: new Date().toISOString() },
      humanTakeover: false,
    });
    expect(result.allowed).toBe(true);
  });

  it("detects STOP keywords", () => {
    expect(isOptOutText("stop")).toBe(true);
    expect(isOptOutText("hello")).toBe(false);
  });

  it("does not send when disconnected", () => {
    const result = canSendWhatsApp({
      connected: false,
      messageKind: "template",
      templateApproved: true,
      consent: { marketingOptIn: true, transactionalAllowed: true, suppressed: false },
      window: { lastCustomerMessageAt: null },
      humanTakeover: false,
    });
    expect(result.allowed).toBe(false);
  });
});
