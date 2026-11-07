import { describe, expect, it } from "vitest";
import { canMarkPublished, validateSocialPayload } from "@/lib/social/validate";

describe("social validation", () => {
  it("requires media for Instagram", () => {
    expect(validateSocialPayload({ platform: "instagram", caption: "Hi", mediaType: "none", mediaCount: 0 }).ok).toBe(false);
  });

  it("does not mark published without a provider id", () => {
    expect(canMarkPublished(true, null)).toBe(false);
    expect(canMarkPublished(true, "123")).toBe(true);
    expect(canMarkPublished(false, "123")).toBe(false);
  });
});
