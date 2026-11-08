import { DESTINATION_COVERS, IMAGES } from "@/lib/site/media";

export const SITE_NAME = "Northridge";

export const DEFAULT_HOME = {
  heroHeading: "Find Your Next Great Adventure.",
  heroSubheading: "Discover unforgettable journeys, meet like-minded travellers and explore India's most extraordinary destinations.",
  heroSupporting:
    "Published Himalayan trips through Spiti, Ladakh and Manali — planned from one travel desk, confirmed only after a real enquiry.",
  ctaPrimary: "Explore trips",
  ctaSecondary: "Plan your trip",
  heroImage: IMAGES.hero,
};

export { DESTINATION_COVERS, IMAGES };

export const HOW_IT_WORKS = [
  { step: "01", title: "Choose a destination", body: "Start with Spiti, Manali, Ladakh, or a custom Himalayan brief." },
  { step: "02", title: "Explore a published trip", body: "Itineraries on this site come from the same catalogue the operations desk uses." },
  { step: "03", title: "Share your requirements", body: "Dates, travellers, and how you like to travel — without inventing availability." },
  { step: "04", title: "Speak with the travel team", body: "A specialist reviews the enquiry in the CRM and follows up on the details you provided." },
  { step: "05", title: "Confirm when you are ready", body: "A journey is confirmed only after a recorded booking — never by viewing a page." },
];

export const WHY_US = [
  { title: "Carefully planned itineraries", body: "Days are sequenced from the same package record the desk operates — not a brochure rewritten for the web.", accent: "sky" },
  { title: "Personal assistance", body: "Enquiries become CRM leads with a follow-up task, so someone on the desk owns the next conversation.", accent: "coral" },
  { title: "Experienced travel guidance", body: "The public site and operations desk share one catalogue, so what you read is what the team actually works from.", accent: "navy" },
  { title: "Group experiences", body: "Ask for a group format. A departure is listed only when it exists in the catalogue.", accent: "green" },
  { title: "Local destination knowledge", body: "Season, permit, and road notes appear only after they are published. We do not invent conditions on the website.", accent: "sun" },
  { title: "Customer support", body: "WhatsApp, phone or email follow-up is recorded in the CRM after you send an enquiry.", accent: "sky" },
];

export const SIGNATURE = [
  { title: "Himalayan road trips", body: "Long-distance journeys paced for people, not just kilometres." },
  { title: "High-valley circuits", body: "Spiti and similar landscapes, planned around season notes the desk has verified." },
  { title: "Private itineraries", body: "Custom briefs collected through the enquiry form and handled as trip enquiries." },
  { title: "Small-group travel", body: "When a group departure exists in the catalogue, it is listed with its published details." },
];
