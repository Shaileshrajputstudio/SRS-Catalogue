// Pure types + helpers for the admin library's catalogue-type tabs
// (Series / Story / General / Product, plus whatever the studio adds
// themselves via Manage Tabs). No R2 fetching here (that's
// catalogueTypesStore.ts, server-only) so this file is safe to import
// from client components too — mirrors the websiteLink.ts /
// websiteCategories.ts split.

export type CatalogueTypeDef = {
  key: string; // stable, pathname-safe slug — never shown to the user
  label: string; // what the tab actually displays, editable any time
};

// What this app shipped with, before tabs became self-serve. Every
// brochure uploaded before this feature existed has a catalogueType of
// "product", "story", "general", or "item" baked into its R2 pathname —
// this is also the fallback when config/catalogue-types.json doesn't
// exist yet (nobody has opened Manage Tabs), so nothing breaks for a
// library that predates it.
export const DEFAULT_CATALOGUE_TYPES: CatalogueTypeDef[] = [
  { key: "product", label: "Series" },
  { key: "story", label: "Story" },
  { key: "general", label: "General" },
  { key: "item", label: "Product" },
];

// Only these three built-in keys get a Website Link chooser at upload —
// "product" and "item" offer the main site's Product Category list,
// "story" offers its Story list. A tab the studio adds themselves has no
// such behavior (there's no sensible way to ask a non-technical client
// which of the main site's category systems a brand-new tab should map
// to) — it behaves like "general": a pure organizing label, nothing more.
export function websiteLinkKindFor(typeKey: string): "category" | "story" | null {
  if (typeKey === "product" || typeKey === "item") return "category";
  if (typeKey === "story") return "story";
  return null;
}

// Turns a label like "Lookbook Sets" into a stable pathname-safe key —
// "lookbook-sets". Falls back to "tab" if the label has no a-z/0-9 in it
// at all (e.g. it's only emoji or punctuation).
export function slugify(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "tab";
}

// Appends "-2", "-3", … on a collision — e.g. adding a tab labeled
// "Story" again when the built-in "story" key is already taken — rather
// than silently reusing (and merging into) the existing tab.
export function uniqueKey(label: string, existing: CatalogueTypeDef[]): string {
  const base = slugify(label);
  const used = new Set(existing.map((t) => t.key));
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
