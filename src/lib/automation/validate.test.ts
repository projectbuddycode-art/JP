import { describe, expect, it } from "vitest";
import { evaluateConditions, validateWorkflowGraph } from "@/lib/automation/validate";

describe("validateWorkflowGraph", () => {
  it("accepts a linear workflow", () => {
    const result = validateWorkflowGraph({
      trigger: { type: "lead_created", params: {} },
      conditions: [],
      actions: [{ id: "a1", type: "create_task", params: {}, requiresApproval: false }],
    });
    expect(result.ok).toBe(true);
  });

  it("rejects wait self-loops", () => {
    const result = validateWorkflowGraph({
      trigger: { type: "lead_created", params: {} },
      actions: [{ id: "wait-1", type: "wait", params: { resumeFrom: "wait-1" }, requiresApproval: false }],
    });
    expect(result.ok).toBe(false);
  });

  it("evaluates conditions", () => {
    expect(evaluateConditions([{ field: "source", op: "eq", value: "meta" }], { source: "meta" })).toBe(true);
    expect(evaluateConditions([{ field: "source", op: "eq", value: "meta" }], { source: "web" })).toBe(false);
  });
});
