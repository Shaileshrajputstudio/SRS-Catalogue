import { cache } from "react";
import { r2List } from "./r2";
import { encodeWebsiteLink, decodeWebsiteLink, type WebsiteLink } from "./websiteLink";

// Server-only: reads BLOB_READ_WRITE_TOKEN, so this must only ever be
// imported from Server Components / Server Actions / Route Handlers,
// never a "use client" file.

// Freeform brochures — no fixed category list, no database. Each PDF is
// stored at brochures/<id>--<encodeURIComponent(title)>.pdf and, when a
// thumbnail was generated, its cover-page PNG at brochure-thumbs/<id>.png.
// The id gives a stable public URL and delete target, the title is
// carried in the pathname itself since there's nowhere else to keep it.
// The blob store's own listing is the entire source of truth.
//
// Tags follow the same pathname-encoding trick, at
// brochure-tags/<id>--<encodeURIComponent(tags.join(","))>.json — so
// reading tags for every brochure costs one extra list() call, never a
// per-brochure fetch. Editing tags deletes the old pathname and writes a
// new one (see updateBrochureTags in app/actions/brochures.ts), since the
// tag list itself IS the pathname.
// The admin library's own organizing split — completely independent of
// Website Link. A brochure can be a Product-type catalogue with no
// Website Link at all (not every product maps to a specific category
// page), so this can never be derived from that field; it has to be its
// own choice. "general" is the deliberate catch-all for anything that
// isn't cleanly one or the other.
//
// The internal key and its display label have drifted apart for two of
// the built-in ones: "product" now displays as "Series" (renamed after
// "item" was added, to leave room for a distinct "Product" tab), and
// "item" is the one that actually displays as "Product". Since Manage
// Tabs, the full set of types is config-driven, not fixed — see
// lib/catalogueTypes.ts for the current list and label map, and
// lib/catalogueTypesStore.ts for where it's persisted. This alias is
// just for readability at call sites; it's a free-form slug string now,
// not a real union.
export type CatalogueType = string;

export type Brochure = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  tags: string[];
  websiteLink: WebsiteLink | null;
  catalogueType: CatalogueType;
  uploadedAt: string; // ISO
};

const PDF_RE = /^brochures\/([a-zA-Z0-9_-]+)--(.+)\.pdf$/;
const THUMB_RE = /^brochure-thumbs\/([a-zA-Z0-9_-]+)\.png$/;
const TAGS_RE = /^brochure-tags\/([a-zA-Z0-9_-]+)--(.*)\.json$/;
const CATEGORY_RE = /^brochure-category\/([a-zA-Z0-9_-]+)--(.*)\.json$/;
const TYPE_RE = /^brochure-type\/([a-zA-Z0-9_-]+)--([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/;

export const TAGS_PREFIX = "brochure-tags/";
export const CATEGORY_PREFIX = "brochure-category/";
export const TYPE_PREFIX = "brochure-type/";

export function buildBrochurePathname(id: string, title: string): string {
  return `brochures/${id}--${encodeURIComponent(title)}.pdf`;
}

export function buildThumbnailPathname(id: string): string {
  return `brochure-thumbs/${id}.png`;
}

export function buildTagsPathname(id: string, tags: string[]): string {
  return `${TAGS_PREFIX}${id}--${encodeURIComponent(tags.join(","))}.json`;
}

// The brochure's matching spot on the main website — a /products category
// or a /collections story — stored the same pathname-encoding way as
// tags, but single-valued. See websiteLink.ts for the encoding.
export function buildWebsiteLinkPathname(id: string, link: WebsiteLink): string {
  return `${CATEGORY_PREFIX}${id}--${encodeWebsiteLink(link)}.json`;
}

export function buildTypePathname(id: string, type: CatalogueType): string {
  return `${TYPE_PREFIX}${id}--${type}.json`;
}

// Was a closed-membership check against a fixed list; now that tabs are
// config-driven (Manage Tabs), this only validates that a value is
// shaped like a slug this app would ever generate itself — the pathname
// character set, not "is this one of today's actual tabs". A value that
// fails this falls back to "general" (see updateBrochureType) rather
// than ever writing something unsafe into an R2 key.
export function isCatalogueType(value: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) && value.length <= 60;
}

// Trims, drops empties, and dedupes case-insensitively (keeping the first
// casing seen) — used both here and in the client-side tag editor so a
// tag typed as "USA" and one typed as "usa" are treated as the same tag.
export function normalizeTags(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of raw) {
    const trimmed = t.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

// Two brochures cross-sell each other in "Explore More" only if they
// share at least one tag — except untagged brochures, which still
// cross-sell freely among themselves (today's behavior, preserved until
// something is deliberately tagged). This is what stops a USA-priced
// brochure from ever surfacing an India-priced one, or vice versa, once
// each is tagged with its region.
export function shareTag(a: string[], b: string[]): boolean {
  if (a.length === 0 && b.length === 0) return true;
  return a.some((t) => b.includes(t));
}

// Wrapped in React's cache() so every call within a single request — the
// page body, generateMetadata, and getBrochureById's own internal call —
// shares one execution instead of each re-running all 5 list() calls.
// A single /brochure/[id] view used to cost 15 List operations this way
// (metadata + page-body double-call); now it costs 5. Purely a
// per-request memo, not a persistent cache — dynamic = "force-dynamic"
// still guarantees a fresh read on every new request.
export const getBrochures = cache(async (): Promise<Brochure[]> => {
  if (!process.env.R2_ACCOUNT_ID) return [];

  const [pdfList, thumbList, tagsList, categoryList, typeList] = await Promise.all([
    r2List("brochures/"),
    r2List("brochure-thumbs/"),
    r2List(TAGS_PREFIX),
    r2List(CATEGORY_PREFIX),
    r2List(TYPE_PREFIX),
  ]);

  const thumbById = new Map<string, string>();
  for (const blob of thumbList) {
    const match = blob.pathname.match(THUMB_RE);
    if (match) thumbById.set(match[1], blob.url);
  }

  const tagsById = new Map<string, string[]>();
  for (const blob of tagsList) {
    const match = blob.pathname.match(TAGS_RE);
    if (!match) continue;
    try {
      const decoded = decodeURIComponent(match[2]);
      tagsById.set(match[1], decoded ? decoded.split(",") : []);
    } catch {
      continue;
    }
  }

  const websiteLinkById = new Map<string, WebsiteLink>();
  for (const blob of categoryList) {
    const match = blob.pathname.match(CATEGORY_RE);
    if (!match) continue;
    const link = decodeWebsiteLink(match[2]);
    if (link) websiteLinkById.set(match[1], link);
  }

  const typeById = new Map<string, CatalogueType>();
  for (const blob of typeList) {
    const match = blob.pathname.match(TYPE_RE);
    if (match) typeById.set(match[1], match[2] as CatalogueType);
  }

  const brochures: Brochure[] = [];
  for (const blob of pdfList) {
    const match = blob.pathname.match(PDF_RE);
    if (!match) continue;
    let title: string;
    try {
      title = decodeURIComponent(match[2]);
    } catch {
      continue;
    }
    brochures.push({
      id: match[1],
      title,
      url: blob.url,
      thumbnailUrl: thumbById.get(match[1]),
      tags: tagsById.get(match[1]) ?? [],
      websiteLink: websiteLinkById.get(match[1]) ?? null,
      // Brochures uploaded before this field existed default to "general"
      // rather than being lost from every tab.
      catalogueType: typeById.get(match[1]) ?? "general",
      uploadedAt: new Date(blob.uploadedAt).toISOString(),
    });
  }

  // Newest first.
  brochures.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
  return brochures;
});

export async function getBrochureById(id: string): Promise<Brochure | null> {
  const all = await getBrochures();
  return all.find((b) => b.id === id) ?? null;
}
