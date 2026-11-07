import { describe, expect, it } from "vitest";
import { isPubliclyListed, publicPackageDto } from "@/lib/site/visibility";

describe("public catalogue", () => {
  it("hides drafts and unpublished trips", () => {
    expect(isPubliclyListed({ status: "draft", website_status: "draft" })).toBe(false);
    expect(isPubliclyListed({ status: "published", website_status: "unpublished" })).toBe(false);
    expect(isPubliclyListed({ status: "published", website_status: "published" })).toBe(true);
    expect(isPubliclyListed({ status: "published" })).toBe(true);
  });

  it("omits price when visibility is quote or contact", () => {
    const dto = publicPackageDto({
      id: "1",
      name: "Spiti",
      slug: "spiti",
      destination: "Spiti Valley",
      price_per_person: 50000,
      price_visibility: "request_quote",
    });
    expect(dto.price_per_person).toBeNull();
  });
});
