import { describe, expect, it } from "vitest";
import { mergeFaqs } from "@/lib/site/editorial";

describe("editorial faqs", () => {
  it("dedupes questions case-insensitively", () => {
    const merged = mergeFaqs(
      [{ q: "How do I book?", a: "From the form." }],
      [{ q: "how do I book?", a: "Duplicate." }, { q: "Is this a booking?", a: "No." }],
    );
    expect(merged).toHaveLength(2);
    expect(merged[0].a).toBe("From the form.");
  });
});
