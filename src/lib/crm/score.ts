export type ScoreInput = {
  hasPhone: boolean;
  hasEmail: boolean;
  destination?: string | null;
  preferredStart?: string | null;
  travellers?: number | null;
  budget?: number | null;
  source?: string | null;
  stageProbability?: number | null;
  isLost?: boolean;
};

export const SCORE_RULES = [
  { key: "phone", points: 20, label: "Reachable phone" },
  { key: "email", points: 10, label: "Email on file" },
  { key: "destination", points: 20, label: "Destination known" },
  { key: "dates", points: 15, label: "Travel dates known" },
  { key: "travellers", points: 10, label: "Traveller count known" },
  { key: "budget", points: 10, label: "Budget indicated" },
  { key: "attributed", points: 5, label: "Source attributed" },
  { key: "stage", points: 10, label: "Stage probability ≥ 40%" },
] as const;

export function scoreLead(input: ScoreInput) {
  if (input.isLost) {
    return { score: 0, reasons: ["Lost / not proceeding"] };
  }
  const reasons: string[] = [];
  let score = 0;
  if (input.hasPhone) {
    score += 20;
    reasons.push("Reachable phone (+20)");
  }
  if (input.hasEmail) {
    score += 10;
    reasons.push("Email on file (+10)");
  }
  if (input.destination) {
    score += 20;
    reasons.push("Destination known (+20)");
  }
  if (input.preferredStart) {
    score += 15;
    reasons.push("Travel dates known (+15)");
  }
  if (input.travellers) {
    score += 10;
    reasons.push("Traveller count known (+10)");
  }
  if (input.budget) {
    score += 10;
    reasons.push("Budget indicated (+10)");
  }
  if (input.source) {
    score += 5;
    reasons.push("Source attributed (+5)");
  }
  if ((input.stageProbability ?? 0) >= 0.4) {
    score += 10;
    reasons.push("Stage probability ≥ 40% (+10)");
  }
  return { score: Math.min(100, score), reasons };
}
