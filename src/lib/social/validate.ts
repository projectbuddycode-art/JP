export type SocialPlatform = "instagram" | "facebook" | "youtube" | "linkedin" | "google_business";

export function validateSocialPayload(input: {
  platform: SocialPlatform;
  caption: string;
  mediaType: "none" | "image" | "video" | "carousel";
  mediaCount: number;
}) {
  const errors: string[] = [];
  if (input.platform === "instagram" && input.mediaType === "none") {
    errors.push("Instagram feed posts require at least one image or video");
  }
  if (input.caption.length > 2200) {
    errors.push("Caption exceeds 2,200 characters");
  }
  if (input.mediaType === "carousel" && (input.mediaCount < 2 || input.mediaCount > 10)) {
    errors.push("Carousels need between 2 and 10 media items");
  }
  if (input.platform === "google_business") {
    errors.push(
      "Google Business Profile publishing is not enabled until account eligibility is verified",
    );
  }
  if (input.platform === "youtube" && input.mediaType !== "video") {
    errors.push("YouTube publishing requires a video file");
  }
  return { ok: errors.length === 0, errors };
}

export function canMarkPublished(providerConfirmed: boolean, providerPostId?: string | null) {
  return providerConfirmed && Boolean(providerPostId);
}
