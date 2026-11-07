import { createAdminClient } from "@/lib/supabase/admin";
import { validateSocialPayload, canMarkPublished } from "@/lib/social/validate";
import { logger } from "@/lib/logger";

export async function publishScheduledPost(postId: string) {
  const admin = createAdminClient();
  const { data: post } = await admin.from("social_posts").select("*").eq("id", postId).maybeSingle();
  if (!post) throw new Error("Post not found");
  if (post.status !== "scheduled" && post.status !== "publishing") {
    return { skipped: true, reason: "Post is not scheduled" };
  }

  const { data: platforms } = await admin
    .from("social_post_platforms")
    .select("*")
    .eq("post_id", postId);

  await admin.from("social_posts").update({ status: "publishing" }).eq("id", postId);

  const { data: secret } = await admin
    .from("integration_secrets")
    .select("payload")
    .eq("provider", "meta_social")
    .maybeSingle();
  const token = (secret?.payload as { accessToken?: string; pageId?: string; igUserId?: string } | null)
    ?.accessToken;
  const pageId = (secret?.payload as { pageId?: string } | undefined)?.pageId;
  const igUserId = (secret?.payload as { igUserId?: string } | undefined)?.igUserId;

  for (const platform of platforms ?? []) {
    const media = Array.isArray(post.media) ? post.media : [];
    const validation = validateSocialPayload({
      platform: platform.platform,
      caption: platform.caption_override || post.caption || "",
      mediaType: media.length === 0 ? "none" : media.length > 1 ? "carousel" : "image",
      mediaCount: media.length,
    });
    if (!validation.ok) {
      await admin
        .from("social_post_platforms")
        .update({ status: "failed", last_error: validation.errors.join("; ") })
        .eq("id", platform.id);
      continue;
    }
    if (!token) {
      await admin
        .from("social_post_platforms")
        .update({
          status: "failed",
          last_error: "Meta publishing credentials are not connected",
        })
        .eq("id", platform.id);
      continue;
    }
    try {
      const published = await publishToMeta({
        platform: platform.platform,
        caption: platform.caption_override || post.caption || "",
        token,
        pageId,
        igUserId,
        imageUrl: media[0]?.url as string | undefined,
      });
      if (!canMarkPublished(true, published.id)) {
        throw new Error("Provider did not confirm a post id");
      }
      await admin
        .from("social_post_platforms")
        .update({
          status: "published",
          provider_post_id: published.id,
          published_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", platform.id);
    } catch (error) {
      logger.error("social_publish_failed", { platform: platform.platform });
      await admin
        .from("social_post_platforms")
        .update({
          status: "failed",
          last_error: error instanceof Error ? error.message : "Publish failed",
        })
        .eq("id", platform.id);
    }
  }

  const { data: latest } = await admin
    .from("social_post_platforms")
    .select("status")
    .eq("post_id", postId);
  const allPublished = (latest ?? []).every((row) => row.status === "published");
  const anyFailed = (latest ?? []).some((row) => row.status === "failed");
  await admin
    .from("social_posts")
    .update({ status: allPublished ? "published" : anyFailed ? "failed" : "publishing" })
    .eq("id", postId);
  return { postId, allPublished, anyFailed };
}

async function publishToMeta(input: {
  platform: string;
  caption: string;
  token: string;
  pageId?: string;
  igUserId?: string;
  imageUrl?: string;
}) {
  if (input.platform === "facebook") {
    if (!input.pageId) throw new Error("Facebook Page id is missing");
    const url = new URL(`https://graph.facebook.com/v21.0/${input.pageId}/feed`);
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: input.caption, access_token: input.token, url: input.imageUrl }),
    });
    const json = (await response.json()) as { id?: string; error?: { message: string } };
    if (!response.ok || !json.id) throw new Error(json.error?.message ?? "Facebook publish failed");
    return { id: json.id };
  }
  if (input.platform === "instagram") {
    if (!input.igUserId || !input.imageUrl) {
      throw new Error("Instagram publishing requires a professional account and an image URL");
    }
    const containerRes = await fetch(`https://graph.facebook.com/v21.0/${input.igUserId}/media`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        image_url: input.imageUrl,
        caption: input.caption,
        access_token: input.token,
      }),
    });
    const container = (await containerRes.json()) as { id?: string; error?: { message: string } };
    if (!container.id) throw new Error(container.error?.message ?? "Instagram container failed");
    const publishRes = await fetch(`https://graph.facebook.com/v21.0/${input.igUserId}/media_publish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ creation_id: container.id, access_token: input.token }),
    });
    const published = (await publishRes.json()) as { id?: string; error?: { message: string } };
    if (!published.id) throw new Error(published.error?.message ?? "Instagram publish failed");
    return { id: published.id };
  }
  throw new Error(`Direct publishing is not implemented for ${input.platform}`);
}
