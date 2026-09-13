"use server";

import { revalidatePath } from "next/cache";
import { getCatalogueTypes, saveCatalogueTypes } from "@/lib/catalogueTypesStore";
import { uniqueKey, type CatalogueTypeDef } from "@/lib/catalogueTypes";
import { getBrochures } from "@/lib/brochures";
import { updateBrochureType } from "@/app/actions/brochures";

export async function addCatalogueType(label: string): Promise<CatalogueTypeDef[]> {
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Give the tab a name.");

  const existing = await getCatalogueTypes();
  const key = uniqueKey(trimmed, existing);
  const next = [...existing, { key, label: trimmed }];

  await saveCatalogueTypes(next);
  revalidatePath("/");
  return next;
}

export async function renameCatalogueType(key: string, label: string): Promise<CatalogueTypeDef[]> {
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Give the tab a name.");

  const existing = await getCatalogueTypes();
  const next = existing.map((t) => (t.key === key ? { ...t, label: trimmed } : t));

  await saveCatalogueTypes(next);
  revalidatePath("/");
  return next;
}

// Only accepts a true permutation of the existing keys — a mismatched
// list (stale client state, a dropped tab) is silently ignored rather
// than risking one falling out of the config entirely.
export async function reorderCatalogueTypes(orderedKeys: string[]): Promise<CatalogueTypeDef[]> {
  const existing = await getCatalogueTypes();
  const byKey = new Map(existing.map((t) => [t.key, t]));
  const next = orderedKeys.map((k) => byKey.get(k)).filter((t): t is CatalogueTypeDef => Boolean(t));

  if (next.length !== existing.length) return existing;

  await saveCatalogueTypes(next);
  revalidatePath("/");
  return next;
}

// Deleting a tab that still has catalogues in it re-types every one of
// them to `moveTo` first — a brochure can never end up pointing at a
// type that no longer exists in the tab list. `moveTo` is required
// whenever the tab being deleted isn't already empty; the client always
// asks for it via a confirm step (see ManageTabsModal), but this is the
// actual guard — this action refuses to silently drop catalogues even if
// called some other way.
export async function deleteCatalogueType(
  key: string,
  moveTo: string | null,
): Promise<{ types: CatalogueTypeDef[]; movedCount: number }> {
  const existing = await getCatalogueTypes();
  if (existing.length <= 1) {
    throw new Error("At least one tab has to stay — this is the last one.");
  }

  const brochures = await getBrochures();
  const affected = brochures.filter((b) => b.catalogueType === key);

  if (affected.length > 0) {
    if (!moveTo || moveTo === key || !existing.some((t) => t.key === moveTo)) {
      throw new Error("Choose another tab to move these catalogues to first.");
    }
    await Promise.all(affected.map((b) => updateBrochureType(b.id, moveTo)));
  }

  const next = existing.filter((t) => t.key !== key);
  await saveCatalogueTypes(next);
  revalidatePath("/");
  return { types: next, movedCount: affected.length };
}
