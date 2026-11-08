export const IMAGES = {
  hero: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80",
  spiti: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=2000&q=80",
  ladakh: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=2000&q=80",
  manali: "https://images.unsplash.com/photo-1593181629936-11c609b8db9b?auto=format&fit=crop&w=2000&q=80",
  chandratal: "https://images.unsplash.com/photo-1578662996444-3d91d9e5adf0?auto=format&fit=crop&w=2000&q=80",
  monastery: "https://images.unsplash.com/photo-1544735716-39224d4fac21?auto=format&fit=crop&w=2000&q=80",
  roads: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=80",
  village: "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=2000&q=80",
  lake: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2000&q=80",
  peaks: "https://images.unsplash.com/photo-1454496522488-7a4faaa698de?auto=format&fit=crop&w=2000&q=80",
  cta: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=2000&q=80",
};

export const DESTINATION_COVERS: Record<string, string> = {
  "spiti-valley": IMAGES.spiti,
  manali: IMAGES.manali,
  ladakh: IMAGES.ladakh,
};

export const DESTINATION_PROFILES: Record<
  string,
  { kicker: string; pull: string; experiences: string[]; gallery: string[] }
> = {
  "spiti-valley": {
    kicker: "High valley",
    pull: "A high-altitude circuit of villages, monastery roads and lake approaches — published only with the itineraries the desk actually operates.",
    experiences: ["Village circuits", "Monastery roads", "High lake approaches"],
    gallery: [IMAGES.spiti, IMAGES.chandratal, IMAGES.monastery, IMAGES.roads],
  },
  ladakh: {
    kicker: "High desert",
    pull: "Long, paced journeys across high desert lakes and mountain roads, listed when a Ladakh package is published in the catalogue.",
    experiences: ["Lake roads", "High passes", "Paced desert travel"],
    gallery: [IMAGES.ladakh, IMAGES.lake, IMAGES.peaks, IMAGES.roads],
  },
  manali: {
    kicker: "Mountain gateway",
    pull: "A Himachal gateway used for Himalayan road trips and onward journeys into the high valleys — not a filler destination card.",
    experiences: ["Mountain roads", "Valley stays", "Onward Himalayan routes"],
    gallery: [IMAGES.manali, IMAGES.village, IMAGES.roads, IMAGES.peaks],
  },
};

export function coverForDestination(slugOrName: string, fallback = IMAGES.hero) {
  const key = slugOrName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return DESTINATION_COVERS[key] || fallback;
}
