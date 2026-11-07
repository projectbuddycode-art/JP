import {
  workflowDefinitionSchema,
  type WorkflowDefinition,
} from "@/lib/automation/schema";

export function validateWorkflowGraph(input: unknown) {
  const parsed = workflowDefinitionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.issues.map((i) => i.message) };
  }
  const definition = parsed.data;
  const waitCycles = detectWaitCycles(definition);
  if (waitCycles) {
    return {
      ok: false as const,
      errors: ["Workflow contains a wait loop that could run indefinitely"],
    };
  }
  const ids = definition.actions.map((a) => a.id);
  if (new Set(ids).size !== ids.length) {
    return { ok: false as const, errors: ["Action ids must be unique"] };
  }
  return { ok: true as const, definition };
}

function detectWaitCycles(definition: WorkflowDefinition) {
  const waitActions = definition.actions.filter((a) => a.type === "wait");
  return waitActions.some((action) => {
    const target = action.params.resumeFrom as string | undefined;
    return target === action.id;
  });
}

export function evaluateConditions(
  conditions: WorkflowDefinition["conditions"],
  context: Record<string, unknown>,
) {
  return conditions.every((condition) => {
    const actual = context[condition.field];
    switch (condition.op) {
      case "eq":
        return actual === condition.value;
      case "neq":
        return actual !== condition.value;
      case "contains":
        return String(actual ?? "").includes(String(condition.value ?? ""));
      case "gt":
        return Number(actual) > Number(condition.value);
      case "lt":
        return Number(actual) < Number(condition.value);
      case "exists":
        return actual !== undefined && actual !== null && actual !== "";
      default:
        return false;
    }
  });
}
