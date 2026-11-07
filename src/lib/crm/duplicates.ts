export type DuplicateCandidate = {
  id: string;
  full_name: string | null;
  phone_e164: string | null;
  email: string | null;
};

export type DuplicateMatch = {
  candidate: DuplicateCandidate;
  reasons: Array<"phone" | "email">;
};

export function findDuplicateMatches(
  input: { phone_e164?: string | null; email?: string | null },
  existing: DuplicateCandidate[],
): DuplicateMatch[] {
  const phone = input.phone_e164?.trim() || null;
  const email = input.email?.trim().toLowerCase() || null;
  const matches: DuplicateMatch[] = [];
  for (const candidate of existing) {
    const reasons: Array<"phone" | "email"> = [];
    if (phone && candidate.phone_e164 && candidate.phone_e164 === phone) {
      reasons.push("phone");
    }
    if (
      email &&
      candidate.email &&
      candidate.email.toLowerCase() === email
    ) {
      reasons.push("email");
    }
    if (reasons.length) matches.push({ candidate, reasons });
  }
  return matches;
}

export function namesLookSimilar(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
