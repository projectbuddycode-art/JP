import { describe, expect, it } from "vitest";
import { getDemoStore, resetDemoStore } from "@/lib/demo/store";

describe("isolated demo store", () => {
  it("mutates in memory and reset restores seed packages", () => {
    const store = getDemoStore();
    store.leads.push({ id: "temp", full_name: "Temporary demo lead" });
    expect(store.leads.some((row) => row.id === "temp")).toBe(true);
    const restored = resetDemoStore();
    expect(restored.leads.some((row) => row.id === "temp")).toBe(false);
    expect(restored.packages.some((row) => row.slug === "spiti-valley-circuit")).toBe(true);
    expect(restored.departures.length).toBeGreaterThan(0);
    expect(restored.suppliers.some((row) => row.kind === "driver")).toBe(true);
  });
});
