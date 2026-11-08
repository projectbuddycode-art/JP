"use client";

import { useMemo, useState } from "react";
import { PhotoGallery } from "@/components/site/photo-gallery";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "spiti", label: "Spiti" },
  { id: "ladakh", label: "Ladakh" },
  { id: "manali", label: "Manali" },
  { id: "group", label: "Group experiences" },
  { id: "road", label: "Road trips" },
] as const;

export function TravellerGallery({
  items,
}: {
  items: Array<{ src: string; category: string; alt: string }>;
}) {
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]["id"]>("all");
  const rows = useMemo(
    () => items.filter((item) => filter === "all" || item.category === filter),
    [items, filter],
  );
  if (!items.length) return null;
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-4 py-2 text-[12px] font-semibold ${
              filter === item.id ? "bg-[#2f9ed8] text-white" : "bg-white text-[#3d5364]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <PhotoGallery images={rows.map((item) => item.src)} label="Traveller gallery" />
      </div>
    </div>
  );
}
