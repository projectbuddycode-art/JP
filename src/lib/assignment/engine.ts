export type AssignmentMode = "manual" | "round_robin" | "destination" | "workload";

export type PartnerCandidate = {
  id: string;
  destinations?: string[];
  activeLeadCount: number;
  available?: boolean;
};

export function pickAssignee(
  mode: AssignmentMode,
  partners: PartnerCandidate[],
  context: { destination?: string | null; lastIndex?: number },
) {
  const available = partners.filter((partner) => partner.available !== false);
  if (!available.length) return null;
  if (mode === "destination" && context.destination) {
    const match = available.find((partner) =>
      (partner.destinations ?? []).some(
        (item) => item.toLowerCase() === context.destination!.toLowerCase(),
      ),
    );
    if (match) return match.id;
  }
  if (mode === "workload") {
    return [...available].sort((a, b) => a.activeLeadCount - b.activeLeadCount)[0].id;
  }
  if (mode === "round_robin") {
    const index = ((context.lastIndex ?? -1) + 1) % available.length;
    return available[index].id;
  }
  return null;
}

export function slaStatus(dueAt: string | null | undefined, resolvedAt?: string | null) {
  if (resolvedAt) return "resolved";
  if (!dueAt) return "pending";
  if (new Date(dueAt) < new Date()) return "overdue";
  return "due";
}
