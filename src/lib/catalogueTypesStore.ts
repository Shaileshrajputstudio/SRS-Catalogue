import "server-only";
import { r2GetText, r2Put } from "./r2";
import { type CatalogueTypeDef, DEFAULT_CATALOGUE_TYPES } from "./catalogueTypes";

// The one piece of config in this whole app that isn't per-brochure —
// tags, website link, and catalogue type are all pathname-encoded per
// brochure (see brochures.ts), but the *list* of catalogue types itself
// has nowhere per-brochure to live. Same "no database" approach as
// everything else here: one small JSON blob, this app's only non-default
// config key.
export const CATALOGUE_TYPES_KEY = "config/catalogue-types.json";

export async function getCatalogueTypes(): Promise<CatalogueTypeDef[]> {
  const raw = await r2GetText(CATALOGUE_TYPES_KEY);
  if (!raw) return DEFAULT_CATALOGUE_TYPES;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_CATALOGUE_TYPES;
    const clean = parsed.filter(
      (t): t is CatalogueTypeDef =>
        Boolean(t) &&
        typeof (t as CatalogueTypeDef).key === "string" &&
        typeof (t as CatalogueTypeDef).label === "string" &&
        (t as CatalogueTypeDef).key.length > 0 &&
        (t as CatalogueTypeDef).label.length > 0,
    );
    return clean.length > 0 ? clean : DEFAULT_CATALOGUE_TYPES;
  } catch {
    return DEFAULT_CATALOGUE_TYPES;
  }
}

export async function saveCatalogueTypes(types: CatalogueTypeDef[]): Promise<void> {
  await r2Put(CATALOGUE_TYPES_KEY, JSON.stringify(types), "application/json");
}
