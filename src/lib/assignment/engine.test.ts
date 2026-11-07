import { describe, expect, it } from "vitest";
import { pickAssignee, slaStatus } from "@/lib/assignment/engine";

const partners = [
  { id: "a", activeLeadCount: 5, destinations: ["Spiti"], available: true },
  { id: "b", activeLeadCount: 1, destinations: ["Ladakh"], available: true },
];

describe("assignment engine", () => {
  it("assigns by destination then workload", () => {
    expect(pickAssignee("destination", partners, { destination: "Ladakh" })).toBe("b");
    expect(pickAssignee("workload", partners, {})).toBe("b");
  });

  it("round-robins from the last index", () => {
    expect(pickAssignee("round_robin", partners, { lastIndex: 0 })).toBe("b");
  });

  it("marks SLA overdue after the due time", () => {
    expect(slaStatus("2000-01-01T00:00:00.000Z")).toBe("overdue");
    expect(slaStatus("2000-01-01T00:00:00.000Z", "2000-01-02T00:00:00.000Z")).toBe("resolved");
  });
});
