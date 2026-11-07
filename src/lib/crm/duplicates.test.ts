import { describe, expect, it } from "vitest";
import { findDuplicateMatches, namesLookSimilar } from "@/lib/crm/duplicates";

describe("findDuplicateMatches", () => {
  const existing = [
    { id: "1", full_name: "Ananya Sharma", phone_e164: "+919811112221", email: "ananya@example.com" },
    { id: "2", full_name: "Ananya Sharma", phone_e164: "+919800000000", email: "other@example.com" },
  ];

  it("matches by phone, not by name", () => {
    const matches = findDuplicateMatches({ phone_e164: "+919811112221" }, existing);
    expect(matches).toHaveLength(1);
    expect(matches[0].reasons).toEqual(["phone"]);
  });

  it("does not merge solely because names match", () => {
    const matches = findDuplicateMatches({ phone_e164: "+919811119999" }, existing);
    expect(matches).toHaveLength(0);
    expect(namesLookSimilar("Ananya Sharma", existing[0].full_name)).toBe(true);
  });

  it("can match both phone and email", () => {
    const matches = findDuplicateMatches(
      { phone_e164: "+919811112221", email: "ananya@example.com" },
      existing,
    );
    expect(matches[0].reasons).toEqual(["phone", "email"]);
  });
});
