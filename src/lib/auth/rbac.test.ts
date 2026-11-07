import { describe, expect, it } from "vitest";
import { canViewLead, hasPermission, navForRole, normalizeRole } from "@/lib/auth/rbac";

describe("rbac", () => {
  it("gives owners every permission", () => {
    expect(hasPermission("owner", "users.manage")).toBe(true);
    expect(hasPermission("owner", "revenue.view")).toBe(true);
    expect(hasPermission("owner", "content.publish")).toBe(true);
    expect(hasPermission("partner", "content.publish")).toBe(false);
  });

  it("keeps partners off other partners' leads and off user admin", () => {
    expect(hasPermission("partner", "users.manage")).toBe(false);
    expect(hasPermission("partner", "leads.view_all")).toBe(false);
    expect(canViewLead("partner", "p1", "p2")).toBe(false);
    expect(canViewLead("partner", "p1", "p1")).toBe(true);
    expect(canViewLead("owner", "p1", "p2")).toBe(true);
  });

  it("blocks viewers from mutations", () => {
    expect(hasPermission("viewer", "leads.edit")).toBe(false);
    expect(hasPermission("viewer", "leads.create")).toBe(false);
    expect(navForRole("viewer").some((item) => item.href === "/team")).toBe(false);
  });

  it("maps legacy member to sales", () => {
    expect(normalizeRole("member")).toBe("sales");
  });

  it("hides administration from partners", () => {
    const hrefs = navForRole("partner").map((item) => item.href);
    expect(hrefs).toContain("/sales");
    expect(hrefs).not.toContain("/integrations");
    expect(hrefs).not.toContain("/team");
  });
});
