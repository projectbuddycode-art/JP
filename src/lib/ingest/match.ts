import type { DuplicateCandidate, DuplicateMatch } from "@/lib/crm/duplicates";
import { findDuplicateMatches } from "@/lib/crm/duplicates";

export function resolveContactMatch(input: {
  phone?: string | null;
  email?: string | null;
  existing: DuplicateCandidate[];
}) {
  const matches = findDuplicateMatches(
    { phone_e164: input.phone, email: input.email },
    input.existing,
  );
  if (!matches.length) {
    return { contactId: null as string | null, matches, ambiguous: false };
  }
  const phoneHit = matches.find((item) => item.reasons.includes("phone"));
  const emailHit = matches.find((item) => item.reasons.includes("email"));
  if (phoneHit && emailHit && phoneHit.candidate.id !== emailHit.candidate.id) {
    return { contactId: phoneHit.candidate.id, matches, ambiguous: true };
  }
  return { contactId: matches[0].candidate.id, matches, ambiguous: false };
}

export function sameProviderEvent(existing: { provider: string; event_id: string }, incoming: { provider: string; event_id: string }) {
  return existing.provider === incoming.provider && existing.event_id === incoming.event_id;
}

export type DuplicateMatchList = DuplicateMatch[];
