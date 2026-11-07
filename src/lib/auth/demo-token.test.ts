import { afterEach, describe, expect, it } from "vitest";
import {
  encodeDemoToken,
  isDemoAuthEnabled,
  safeEqual,
  verifyDemoToken,
} from "@/lib/auth/demo-token";

const original = {
  mode: process.env.DEMO_MODE,
  secret: process.env.DEMO_SESSION_SECRET,
};

afterEach(() => {
  process.env.DEMO_MODE = original.mode;
  process.env.DEMO_SESSION_SECRET = original.secret;
});

describe("demo auth tokens", () => {
  it("requires DEMO_MODE=true", () => {
    process.env.DEMO_MODE = "false";
    expect(isDemoAuthEnabled()).toBe(false);
    process.env.DEMO_MODE = "true";
    expect(isDemoAuthEnabled()).toBe(true);
  });

  it("signs and verifies a session, then expires", () => {
    process.env.DEMO_MODE = "true";
    process.env.DEMO_SESSION_SECRET = "unit-test-secret-not-for-production";
    const token = encodeDemoToken("demo-user", 1_000);
    expect(verifyDemoToken(token, 1_500)).toBe("demo-user");
    expect(verifyDemoToken(token, 1_000 + 13 * 60 * 60 * 1000)).toBeNull();
    expect(verifyDemoToken("tampered." + token.split(".")[1], 1_500)).toBeNull();
  });

  it("compares strings in constant time without leaking length-match on mismatch", () => {
    expect(safeEqual("correct-horse", "correct-horse")).toBe(true);
    expect(safeEqual("correct-horse", "wrong-password")).toBe(false);
    expect(safeEqual("user-one", "user-two")).toBe(false);
  });
});
