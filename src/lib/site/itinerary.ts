export type ItineraryDay = {
  day: string;
  title: string;
  body: string;
  location?: string;
};

export function formatItinerary(raw: unknown): ItineraryDay[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((day, index) => {
    if (typeof day === "string") {
      return { day: String(index + 1), title: day, body: "" };
    }
    if (day && typeof day === "object") {
      const value = day as Record<string, unknown>;
      const title = value.title ?? value.heading ?? value.summary ?? value.location;
      const body = value.description ?? value.body ?? value.details ?? value.highlights;
      return {
        day: String(value.day ?? index + 1),
        title: title ? String(title) : `Day ${index + 1}`,
        body: body ? String(body) : "",
        location: value.location ? String(value.location) : undefined,
      };
    }
    return { day: String(index + 1), title: `Day ${index + 1}`, body: "" };
  });
}

export function formatFaqs(raw: unknown): Array<{ q: string; a: string }> {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    if (typeof item === "string") return { q: `Question ${index + 1}`, a: item };
    if (item && typeof item === "object") {
      const value = item as Record<string, unknown>;
      return {
        q: String(value.question ?? value.q ?? `Question ${index + 1}`),
        a: String(value.answer ?? value.a ?? value.body ?? ""),
      };
    }
    return { q: `Question ${index + 1}`, a: "" };
  }).filter((item) => item.a);
}

export function highlightList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => (typeof item === "string" ? item : item && typeof item === "object" && "text" in item ? String((item as { text: string }).text) : "")).filter(Boolean);
}
