export const IMAGES = {
  hero: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80",
  spiti: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=2000&q=80",
  spitiPeaks: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=80",
  ladakh: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=2000&q=80",
  manali: "https://images.unsplash.com/photo-1593181629936-11c609b8db9b?auto=format&fit=crop&w=2000&q=80",
  chandratal: "https://images.unsplash.com/photo-1578662996444-3d91d9e5adf0?auto=format&fit=crop&w=2000&q=80",
  monastery: "https://images.unsplash.com/photo-1544735716-39224d4fac21?auto=format&fit=crop&w=2000&q=80",
  roads: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=80",
  village: "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=2000&q=80",
  lake: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2000&q=80",
  peaks: "https://images.unsplash.com/photo-1454496522488-7a4faaa698de?auto=format&fit=crop&w=2000&q=80",
  cta: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=2000&q=80",
  pines: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=2000&q=80",
  pass: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=2000&q=80",
  snowridge: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=2000&q=80",
  dusk: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=2000&q=80",
};

/** Licensed Pexels stock (landscape footage). Poster stills are Unsplash. */
export const VIDEOS = {
  hero: "https://videos.pexels.com/video-files/3571264/3571264-hd_1280_720_30fps.mp4",
  peaks: "https://videos.pexels.com/video-files/2169880/2169880-hd_1280_720_30fps.mp4",
  lake: "https://videos.pexels.com/video-files/1093662/1093662-hd_1280_720_30fps.mp4",
  ridge: "https://videos.pexels.com/video-files/3015510/3015510-hd_1280_720_24fps.mp4",
};

export const DESTINATION_COVERS: Record<string, string> = {
  "spiti-valley": IMAGES.spiti,
  manali: IMAGES.manali,
  ladakh: IMAGES.ladakh,
};

export const DESTINATION_VIDEOS: Record<string, string> = {
  "spiti-valley": VIDEOS.hero,
  ladakh: VIDEOS.lake,
  manali: VIDEOS.peaks,
};

export type DestinationProfile = {
  kicker: string;
  pull: string;
  overview: string;
  whoFor: string;
  experiences: string[];
  gallery: string[];
  video?: string;
  faqs: Array<{ q: string; a: string }>;
};

export const DESTINATION_PROFILES: Record<string, DestinationProfile> = {
  "spiti-valley": {
    kicker: "High valley · Himachal Pradesh",
    pull: "A high-altitude circuit of villages, monastery roads and lake approaches — published only with the itineraries the desk actually operates.",
    overview:
      "Spiti Valley sits in the rain-shadow of the Greater Himalaya in Himachal Pradesh. Northridge lists Spiti journeys only when a package exists in the travel desk catalogue. Typical published circuits mention places such as Kaza, Key Monastery and the Chandratal approach when those days are written into the itinerary — we do not invent road status, permit rules or opening dates on this page. Season notes appear only after the desk publishes them on the destination or package record.",
    whoFor:
      "Travellers who want a paced high-valley circuit with personal follow-up after enquiry, not a last-minute confirmed departure from a brochure.",
    experiences: ["Village circuits", "Monastery roads", "High lake approaches", "Himalayan road days"],
    gallery: [IMAGES.spiti, IMAGES.spitiPeaks, IMAGES.chandratal, IMAGES.monastery, IMAGES.roads, IMAGES.village],
    video: VIDEOS.hero,
    faqs: [
      {
        q: "How do I plan a Spiti Valley trip with Northridge?",
        a: "Open a published Spiti journey, or send a custom enquiry with dates, travellers and how you like to travel. The form creates a CRM lead. The travel desk confirms season, permits and availability after that conversation — not when you view this page.",
      },
      {
        q: "Are Spiti road and permit details shown here?",
        a: "Only when the travel desk has published season or permit notes on the destination or package. Live road status is never assumed from this website.",
      },
      {
        q: "Can Spiti trips be private or group?",
        a: "Yes, when that format exists on a published package or when you request a custom brief. A group departure is listed only if it is scheduled in the catalogue.",
      },
    ],
  },
  ladakh: {
    kicker: "High desert · Union Territory",
    pull: "Long, paced journeys across high desert lakes and mountain roads, listed when a Ladakh package is published in the catalogue.",
    overview:
      "Ladakh is a high-altitude desert region of the Indian Himalaya, often travelled via Leh and onward lake or valley roads. Northridge publishes Ladakh itineraries from the same catalogue the operations desk uses. Names such as Nubra or Pangong appear on a trip page only when they are written into that package. Acclimatisation, flights and permit notes are confirmed after enquiry; this page does not replace official notices.",
    whoFor:
      "Travellers who prefer a paced high-desert road trip with clear next steps after an enquiry, rather than an instant confirmed booking.",
    experiences: ["Lake roads", "High passes", "Paced desert travel", "Leh-based circuits"],
    gallery: [IMAGES.ladakh, IMAGES.lake, IMAGES.peaks, IMAGES.roads, IMAGES.dusk, IMAGES.snowridge],
    video: VIDEOS.lake,
    faqs: [
      {
        q: "How do I enquire for a Ladakh road trip?",
        a: "Choose a published Ladakh journey or use Plan your trip. Share dates, travellers and whether you want a private or group format. Northridge stores that as a CRM enquiry and follows up from the travel desk.",
      },
      {
        q: "Does a Ladakh page confirm my flights or permits?",
        a: "No. A published itinerary is information. Flights, permits and live availability are confirmed by the desk after your enquiry.",
      },
    ],
  },
  manali: {
    kicker: "Mountain gateway · Himachal Pradesh",
    pull: "A Himachal gateway used for Himalayan road trips and onward journeys into the high valleys — not a filler destination card.",
    overview:
      "Manali is a mountain town in the Kullu Valley and a common starting point for longer Himalayan road journeys, including routes that continue toward Spiti when a published package says so. Weekend and longer Manali itineraries appear here only as CRM packages. Solang, Old Manali or similar place names are listed when they are part of that package, not as a generic template.",
    whoFor:
      "Travellers looking for a Himachal gateway stay or a starting point for a longer published Himalayan circuit.",
    experiences: ["Mountain roads", "Valley stays", "Onward Himalayan routes", "Short breaks when published"],
    gallery: [IMAGES.manali, IMAGES.pines, IMAGES.village, IMAGES.roads, IMAGES.peaks, IMAGES.dusk],
    video: VIDEOS.peaks,
    faqs: [
      {
        q: "Is Manali only a weekend trip?",
        a: "No. Some published packages are short breaks; others use Manali as a gateway for longer Himalayan roads. The duration on each journey page is the duration written in the catalogue.",
      },
      {
        q: "Can I start a Spiti circuit from Manali?",
        a: "When a published package includes that routing, it is written on the itinerary. Ask the desk if you need a custom start point — that becomes a trip enquiry, not an automatic confirmed departure.",
      },
    ],
  },
};

export function destinationKey(slugOrName: string) {
  return slugOrName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function coverForDestination(slugOrName: string, fallback = IMAGES.hero) {
  return DESTINATION_COVERS[destinationKey(slugOrName)] || fallback;
}

export function videoForDestination(slugOrName: string) {
  return DESTINATION_VIDEOS[destinationKey(slugOrName)];
}

export function profileForDestination(slugOrName: string) {
  return DESTINATION_PROFILES[destinationKey(slugOrName)];
}

export function galleryForDestination(slugOrName: string, extra?: string | null) {
  const profile = profileForDestination(slugOrName);
  const base = profile?.gallery ?? [coverForDestination(slugOrName), IMAGES.roads, IMAGES.village];
  return Array.from(new Set([extra, ...base].filter(Boolean) as string[]));
}
