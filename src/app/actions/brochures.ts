"use server";

import { r2Del, r2List, r2Put } from "@/lib/r2";
import { revalidatePath } from "next/cache";
import {
  buildThumbnailPathname,
  buildTagsPathname,
  buildWebsiteLinkPathname,
  buildTypePathname,
  normalizeTags,
  isCatalogueType,
  TAGS_PREFIX,
  CATEGORY_PREFIX,
  TYPE_PREFIX,
  type CatalogueType,
} from "@/lib/brochures";
import { getWebsiteLinkOptions } from "@/lib/websiteCategories";
import { parseWebsiteLinkSelection, type WebsiteLink } from "@/lib/websiteLink";

// Deleting sends no file body, so it stays a normal Server Action — only
// uploads need the client-upload route (src/app/api/brochures/upload),
// since Vercel's 4.5MB request-body limit can't be raised.
export async function deleteBrochure(pdfPathname: string, id: string): Promise<void> {
  if (!pdfPathname.startsWith("brochures/")) {
    throw new Error("Invalid brochure.");
  }
  // R2 delete doesn't error when a key doesn't exist, so it's safe to
  // always try the thumbnail (and any tags/category/type object) too even
  // for brochures that never got one.
  const [existingTags, existingCategory, existingType] = await Promise.all([
    r2List(`${TAGS_PREFIX}${id}--`),
    r2List(`${CATEGORY_PREFIX}${id}--`),
    r2List(`${TYPE_PREFIX}${id}--`),
  ]);
  await Promise.all([
    r2Del(pdfPathname),
    r2Del(buildThumbnailPathname(id)),
    ...existingTags.map((b) => r2Del(b.pathname)),
    ...existingCategory.map((b) => r2Del(b.pathname)),
    ...existingType.map((b) => r2Del(b.pathname)),
  ]);
  revalidatePath("/");
}

// Tags live in the tags blob's own pathname (see lib/brochures.ts), so
// "changing" them means deleting whatever pathname is there now and
// writing a new one — there's no in-place update of blob content.
export async function updateBrochureTags(id: string, rawTags: string[]): Promise<string[]> {
  const tags = normalizeTags(rawTags);

  const existing = await r2List(`${TAGS_PREFIX}${id}--`);
  await Promise.all(existing.map((b) => r2Del(b.pathname)));

  if (tags.length > 0) {
    await r2Put(buildTagsPathname(id, tags), JSON.stringify({ tags }), "application/json");
  }

  revalidatePath("/");
  revalidatePath(`/brochure/${id}`);
  return tags;
}

// Same pathname-encoding pattern as tags, but single-valued — pass ""
// to clear it. `rawSelection` is the <select>'s own "type|value" string;
// it's re-resolved against the live category/story list here rather than
// trusting whatever label the client sent, so a stale option can't get
// saved with the wrong display text.
export async function updateBrochureWebsiteLink(id: string, rawSelection: string): Promise<WebsiteLink | null> {
  const options = await getWebsiteLinkOptions();
  const link = parseWebsiteLinkSelection(rawSelection, options);

  const existing = await r2List(`${CATEGORY_PREFIX}${id}--`);
  await Promise.all(existing.map((b) => r2Del(b.pathname)));

  if (link) {
    await r2Put(buildWebsiteLinkPathname(id, link), JSON.stringify(link), "application/json");
  }

  revalidatePath("/");
  revalidatePath(`/brochure/${id}`);
  return link;
}

// The admin library's own Product/Story/General split — always exactly
// one value, unlike tags or the website link. Same delete-then-write
// pathname pattern; falls back to "general" for anything invalid so this
// can never leave a brochure without a type.
export async function updateBrochureType(id: string, rawType: string): Promise<CatalogueType> {
  const type: CatalogueType = isCatalogueType(rawType) ? rawType : "general";

  const existing = await r2List(`${TYPE_PREFIX}${id}--`);
  await Promise.all(existing.map((b) => r2Del(b.pathname)));

  await r2Put(buildTypePathname(id, type), JSON.stringify({ type }), "application/json");

  revalidatePath("/");
  return type;
}
