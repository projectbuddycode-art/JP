import { describe, expect, it } from "vitest";
import { enquirySchema, newsletterSchema } from "@/lib/site/enquiry";

describe("website enquiry validation", () => {
  it("rejects submissions without consent", () => {
    const parsed = enquirySchema.safeParse({
      full_name: "Asha",
      phone: "+919811112221",
      consent: "off",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a minimal valid enquiry", () => {
    const parsed = enquirySchema.safeParse({
      full_name: "Asha",
      phone: "+919811112221",
      consent: "on",
    });
    expect(parsed.success).toBe(true);
  });

  it("requires newsletter consent", () => {
    expect(newsletterSchema.safeParse({ email: "a@b.com", consent: "on" }).success).toBe(true);
    expect(newsletterSchema.safeParse({ email: "a@b.com" }).success).toBe(false);
  });
});
