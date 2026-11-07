import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import {
  extractGoogleLeadFields,
  verifyGoogleAdsKey,
  verifyHmacSha256,
} from "@/lib/integrations/google-ads";

describe("Google Ads lead webhook helpers", () => {
  it("extracts fields and flags test events", () => {
    const fields = extractGoogleLeadFields({
      lead_id: "abc",
      is_test: true,
      campaign_id: "c1",
      extra_unknown: "ignored",
      user_column_data: [
        { column_id: "FULL_NAME", string_value: "Test User" },
        { column_id: "PHONE_NUMBER", string_value: "9876543210" },
      ],
    });
    expect(fields.providerLeadId).toBe("abc");
    expect(fields.isTest).toBe(true);
    expect(fields.fullName).toBe("Test User");
  });

  it("rejects missing or mismatched keys", () => {
    expect(verifyGoogleAdsKey("a", "b").ok).toBe(false);
    expect(verifyGoogleAdsKey("secret", "secret").ok).toBe(true);
    expect(verifyGoogleAdsKey(undefined, "secret").ok).toBe(false);
  });

  it("verifies HMAC signatures", () => {
    const secret = "app-secret";
    const body = '{"ok":true}';
    const digest = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyHmacSha256(body, `sha256=${digest}`, secret)).toBe(true);
    expect(verifyHmacSha256(body, "sha256=deadbeef", secret)).toBe(false);
  });
});
