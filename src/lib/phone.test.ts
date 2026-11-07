import { describe, expect, it } from "vitest";
import { normalizePhone, phonesMatch } from "@/lib/phone";

describe("normalizePhone", () => {
  it("normalises Indian numbers to E.164", () => {
    expect(normalizePhone("9876543210")).toBe("+919876543210");
    expect(normalizePhone("+91 98765 43210")).toBe("+919876543210");
  });

  it("rejects invalid numbers", () => {
    expect(normalizePhone("123")).toBeNull();
    expect(normalizePhone("")).toBeNull();
  });

  it("matches equivalent numbers", () => {
    expect(phonesMatch("9876543210", "+919876543210")).toBe(true);
  });
});
