"use server";

import { revalidatePath } from "next/cache";
import { requireActiveProfile } from "@/lib/auth/session";
import { assertPermission } from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/audit";

export async function saveWebsitePageAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  assertPermission(profile, "content.publish");
  const pageKey = String(formData.get("page_key") || "home");
  const { data: existing } = await supabase.from("website_pages").select("id, content").eq("page_key", pageKey).maybeSingle();
  const previous = ((existing?.content ?? {}) as Record<string, unknown>) || {};
  const content = {
    ...previous,
    heroHeading: String(formData.get("heroHeading") || ""),
    heroSubheading: String(formData.get("heroSubheading") || ""),
    heroSupporting: String(formData.get("heroSupporting") || ""),
    ctaPrimary: String(formData.get("ctaPrimary") || ""),
    ctaSecondary: String(formData.get("ctaSecondary") || ""),
    body: String(formData.get("body") || formData.get("mission") || previous.body || ""),
    mission: String(formData.get("mission") || previous.mission || ""),
    philosophy: String(formData.get("philosophy") || previous.philosophy || ""),
    verifiedStatOne: String(formData.get("verifiedStatOne") || previous.verifiedStatOne || ""),
    verifiedStatTwo: String(formData.get("verifiedStatTwo") || previous.verifiedStatTwo || ""),
  };
  if (existing) {
    await supabase.from("website_pages").update({
      content,
      seo_title: String(formData.get("seo_title") || ""),
      seo_description: String(formData.get("seo_description") || ""),
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    }).eq("page_key", pageKey);
    await supabase.from("website_revisions").insert({
      entity_type: "website_pages",
      entity_id: existing.id,
      content: existing.content,
      editor_id: profile.id,
    });
  } else {
    await supabase.from("website_pages").insert({
      page_key: pageKey,
      title: pageKey,
      content,
      status: "published",
      updated_by: profile.id,
    });
  }
  await writeAudit({ actor: profile, action: "website_page_updated", entityType: "website_pages", entityName: pageKey });
  revalidatePath("/");
  revalidatePath("/website");
}

export async function publishPackageWebsiteAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  assertPermission(profile, "content.publish");
  const id = String(formData.get("id"));
  const websiteStatus = String(formData.get("website_status") || "draft");
  const { data: pack } = await supabase.from("packages").select("*").eq("id", id).single();
  if (!pack) throw new Error("Package not found");
  const published = websiteStatus === "published";
  const { error } = await supabase
    .from("packages")
    .update({
      website_status: websiteStatus,
      status: published ? "published" : pack.status === "archived" ? "archived" : "draft",
      published_at: published ? new Date().toISOString() : pack.published_at,
      unpublished_at: websiteStatus === "unpublished" ? new Date().toISOString() : null,
      cover_image_url: String(formData.get("cover_image_url") || pack.cover_image_url || ""),
      seo_title: String(formData.get("seo_title") || pack.seo_title || pack.name),
      seo_description: String(formData.get("seo_description") || pack.short_description || ""),
      price_visibility: String(formData.get("price_visibility") || pack.price_visibility || "starting_from"),
      trip_type: String(formData.get("trip_type") || pack.trip_type || ""),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("package_versions").insert({
    package_id: id,
    snapshot: pack,
    editor_id: profile.id,
  });
  await writeAudit({
    actor: profile,
    action: published ? "trip_published" : "trip_unpublished",
    entityType: "packages",
    entityId: id,
    entityName: pack.name,
    newValue: websiteStatus,
    previousValue: pack.website_status,
  });
  revalidatePath("/packages");
  revalidatePath("/website");
  revalidatePath("/trips");
  revalidatePath(`/trips/${pack.slug}`);
  revalidatePath("/sitemap.xml");
}

export async function saveArticleAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  assertPermission(profile, "content.publish");
  const status = String(formData.get("status") || "draft");
  const payload = {
    title: String(formData.get("title") || "Untitled"),
    slug: String(formData.get("slug") || `guide-${Date.now()}`),
    excerpt: String(formData.get("excerpt") || ""),
    body: String(formData.get("body") || ""),
    category: String(formData.get("category") || "Guide"),
    destination_slug: String(formData.get("destination_slug") || ""),
    status,
    author_name: profile.full_name || profile.email,
    published_at: status === "published" ? new Date().toISOString() : null,
    created_by: profile.id,
  };
  const { error } = await supabase.from("website_articles").insert(payload);
  if (error) throw new Error(error.message);
  await writeAudit({ actor: profile, action: "article_saved", entityType: "website_articles", entityName: payload.title, newValue: status });
  revalidatePath("/travel-guides");
  revalidatePath("/website");
}

export async function saveDestinationAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  assertPermission(profile, "content.publish");
  const slug = String(formData.get("slug") || "").trim();
  if (!slug) throw new Error("Destination slug is required");
  const payload = {
    name: String(formData.get("name") || slug),
    slug,
    summary: String(formData.get("summary") || ""),
    overview: String(formData.get("overview") || ""),
    best_season: String(formData.get("best_season") || ""),
    hero_image_url: String(formData.get("hero_image_url") || ""),
    seo_title: String(formData.get("seo_title") || ""),
    seo_description: String(formData.get("seo_description") || ""),
    status: String(formData.get("status") || "published"),
    updated_at: new Date().toISOString(),
  };
  const { data: existing } = await supabase.from("website_destinations").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("website_destinations").update(payload).eq("slug", slug);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("website_destinations").insert(payload);
    if (error) throw new Error(error.message);
  }
  await writeAudit({ actor: profile, action: "destination_updated", entityType: "website_destinations", entityName: payload.name });
  revalidatePath("/destinations");
  revalidatePath(`/destinations/${slug}`);
  revalidatePath("/website");
}

export async function saveOfferAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  assertPermission(profile, "content.publish");
  const payload = {
    title: String(formData.get("title") || ""),
    discount_label: String(formData.get("discount_label") || ""),
    coupon_code: String(formData.get("coupon_code") || ""),
    valid_until: String(formData.get("valid_until") || "") || null,
    applicable_trips: String(formData.get("applicable_trips") || ""),
    banner_image_url: String(formData.get("banner_image_url") || ""),
    cta_label: String(formData.get("cta_label") || "View trips"),
    cta_href: String(formData.get("cta_href") || "/trips"),
    status: String(formData.get("status") || "draft"),
    updated_at: new Date().toISOString(),
  };
  if (!payload.title) throw new Error("Offer title is required");
  const { error } = await supabase.from("website_offers").insert(payload);
  if (error) throw new Error(error.message);
  await writeAudit({ actor: profile, action: "offer_saved", entityType: "website_offers", entityName: payload.title });
  revalidatePath("/");
  revalidatePath("/website");
}

export async function moderateTestimonialAction(formData: FormData) {
  const { supabase, profile } = await requireActiveProfile();
  assertPermission(profile, "content.publish");
  const id = String(formData.get("id"));
  const status = String(formData.get("status") || "draft");
  const featured = formData.get("featured") === "on";
  const { error } = await supabase
    .from("website_testimonials")
    .update({
      status,
      featured,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await writeAudit({ actor: profile, action: "testimonial_moderated", entityType: "website_testimonials", entityId: id, newValue: status });
  revalidatePath("/");
  revalidatePath("/reviews");
  revalidatePath("/website/reviews");
}
