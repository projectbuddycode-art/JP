"use client";

import { useState } from "react";

export function PhotoGallery({ images, label }: { images: string[]; label: string }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!images.length) return null;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            className={`group relative min-h-[180px] overflow-hidden rounded-3xl md:min-h-[240px] ${index === 0 ? "col-span-2 md:min-h-[420px]" : ""}`}
            onClick={() => setOpen(image)}
            aria-label={`Open ${label} photograph ${index + 1}`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.06]"
              style={{ backgroundImage: `url(${image})` }}
            />
          </button>
        ))}
      </div>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${label} photograph`}
          onClick={() => setOpen(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={open} alt={label} className="max-h-[90vh] max-w-full object-contain" />
        </div>
      ) : null}
    </>
  );
}
