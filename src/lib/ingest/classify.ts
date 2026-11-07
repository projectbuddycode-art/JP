const ENQUIRY_RE =
  /\b(spiti|ladakh|manali|itinerary|package|price|cost|book|booking|enquiry|inquiry|trip|trek|permit|group|dates?)\b/i;

export function looksLikeTravelEnquiry(text: string | null | undefined) {
  if (!text) return false;
  return ENQUIRY_RE.test(text);
}

export type CommentIntent =
  | "travel_enquiry"
  | "price_enquiry"
  | "destination_question"
  | "general_comment"
  | "spam"
  | "other";

export function classifyComment(text: string | null | undefined): CommentIntent {
  const value = (text ?? "").trim();
  if (!value) return "other";
  if (/(http|buy followers|crypto|loan|seo)\b/i.test(value)) return "spam";
  if (/\b(price|cost|how much|rate|per person)\b/i.test(value)) return "price_enquiry";
  if (/\b(spiti|ladakh|manali|himachal|leh)\b/i.test(value)) return "destination_question";
  if (looksLikeTravelEnquiry(value)) return "travel_enquiry";
  if (value.length < 8) return "general_comment";
  return "general_comment";
}

export function commentCreatesLead(intent: CommentIntent) {
  return intent === "travel_enquiry" || intent === "price_enquiry" || intent === "destination_question";
}
