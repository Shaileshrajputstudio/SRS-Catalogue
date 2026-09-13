"use client";

import { useEffect, useState } from "react";
import type { CatalogueTypeDef } from "@/lib/catalogueTypes";
import {
  addCatalogueType,
  renameCatalogueType,
  reorderCatalogueTypes,
  deleteCatalogueType,
} from "@/app/actions/catalogueTypes";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

function PencilIcon({ className = "h-4.5 w-4.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="m14.5 5.5 4 4L8 20H4v-4l10.5-10.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon({ className = "h-4.5 w-4.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0-.8 12.1a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7h12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronUpIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// The gear icon next to the tabs row opens this — add, rename, reorder,
// or remove the catalogue-type tabs shown on the dashboard, without a
// developer editing code. Backed by config/catalogue-types.json in R2
// (see lib/catalogueTypesStore.ts) — the one piece of config in this app
// that isn't per-brochure.
//
// Deleting an empty tab is instant, no friction — deleting one that
// still has catalogues in it expands an inline "move them to…" step
// instead, matching how every other destructive action in this app
// (remove a catalogue, log out, remove a tag) always confirms first and
// never silently loses data.
export function ManageTabsModal({
  catalogueTypes,
  counts,
  onClose,
  onTypesChange,
  onBrochuresRetyped,
}: {
  catalogueTypes: CatalogueTypeDef[];
  counts: Record<string, number>;
  onClose: () => void;
  onTypesChange: (next: CatalogueTypeDef[]) => void;
  onBrochuresRetyped: (fromKey: string, toKey: string) => void;
}) {
  useBodyScrollLock(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingKey, setRenamingKey] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);
  const [moveTo, setMoveTo] = useState("");
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newLabel.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const next = await addCatalogueType(trimmed);
      onTypesChange(next);
      setNewLabel("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that tab.");
    } finally {
      setBusy(false);
    }
  }

  function startRename(t: CatalogueTypeDef) {
    setPendingDeleteKey(null);
    setError(null);
    setRenamingKey(t.key);
    setRenameDraft(t.label);
  }

  async function saveRename(key: string) {
    const trimmed = renameDraft.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const next = await renameCatalogueType(key, trimmed);
      onTypesChange(next);
      setRenamingKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't rename that tab.");
    } finally {
      setBusy(false);
    }
  }

  async function move(key: string, direction: -1 | 1) {
    if (busy) return;
    const idx = catalogueTypes.findIndex((t) => t.key === key);
    const swapWith = idx + direction;
    if (idx < 0 || swapWith < 0 || swapWith >= catalogueTypes.length) return;
    const reordered = [...catalogueTypes];
    [reordered[idx], reordered[swapWith]] = [reordered[swapWith], reordered[idx]];
    setBusy(true);
    setError(null);
    try {
      const next = await reorderCatalogueTypes(reordered.map((t) => t.key));
      onTypesChange(next);
    } catch {
      setError("Couldn't reorder tabs.");
    } finally {
      setBusy(false);
    }
  }

  function requestDelete(key: string) {
    setRenamingKey(null);
    setError(null);
    if ((counts[key] ?? 0) === 0) {
      void doDelete(key, null);
      return;
    }
    setPendingDeleteKey(key);
    setMoveTo(catalogueTypes.find((t) => t.key !== key)?.key ?? "");
  }

  async function doDelete(key: string, moveToKey: string | null) {
    setBusy(true);
    setError(null);
    try {
      const { types, movedCount } = await deleteCatalogueType(key, moveToKey);
      onTypesChange(types);
      if (moveToKey && movedCount > 0) onBrochuresRetyped(key, moveToKey);
      setPendingDeleteKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that tab.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="animate-backdrop-in fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:px-4 sm:py-8"
      onClick={busy ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet-up flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-[var(--paper)] shadow-2xl sm:max-h-[80vh] sm:rounded-2xl"
      >
        <div className="p-6 pb-4">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--ink)]/15 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg text-[var(--ink)]">Manage Tabs</h2>
              <p className="font-sans-ui mt-1 text-xs text-[var(--ink)]/50">
                Add, rename, reorder, or remove the tabs shown above.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
              className="font-sans-ui shrink-0 text-lg text-[var(--ink)]/50 hover:text-[var(--ink)] disabled:opacity-40"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-5">
          <div className="flex flex-col gap-2">
            {catalogueTypes.map((t, idx) => (
              <div key={t.key} className="rounded-xl border border-[var(--line)] bg-[#F6F3E8]/60 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex shrink-0 flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={busy || idx === 0}
                      onClick={() => move(t.key, -1)}
                      aria-label={`Move ${t.label} up`}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink)]/40 transition hover:bg-[var(--ink)]/5 hover:text-[var(--ink)] disabled:opacity-20 disabled:hover:bg-transparent"
                    >
                      <ChevronUpIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      disabled={busy || idx === catalogueTypes.length - 1}
                      onClick={() => move(t.key, 1)}
                      aria-label={`Move ${t.label} down`}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink)]/40 transition hover:bg-[var(--ink)]/5 hover:text-[var(--ink)] disabled:opacity-20 disabled:hover:bg-transparent"
                    >
                      <ChevronDownIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {renamingKey === t.key ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        autoFocus
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void saveRename(t.key);
                          }
                        }}
                        disabled={busy}
                        className="font-sans-ui w-0 flex-1 rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                      />
                      <button
                        type="button"
                        onClick={() => void saveRename(t.key)}
                        disabled={busy || !renameDraft.trim()}
                        className="font-sans-ui shrink-0 text-sm font-medium text-[var(--ink)] disabled:opacity-40"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setRenamingKey(null)}
                        disabled={busy}
                        className="font-sans-ui shrink-0 text-sm text-[var(--ink)]/50 hover:text-[var(--ink)]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-sans-ui flex-1 truncate text-sm text-[var(--ink)]">{t.label}</span>
                      <span className="font-sans-ui text-xs text-[var(--ink)]/40">{counts[t.key] ?? 0}</span>
                      <button
                        type="button"
                        onClick={() => startRename(t)}
                        disabled={busy}
                        aria-label={`Rename ${t.label}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--ink)]/40 transition hover:bg-[var(--ink)]/5 hover:text-[var(--ink)] disabled:opacity-40"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(t.key)}
                        disabled={busy || catalogueTypes.length <= 1}
                        aria-label={`Delete ${t.label}`}
                        title={catalogueTypes.length <= 1 ? "At least one tab has to stay" : undefined}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--ink)]/40 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {pendingDeleteKey === t.key && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="font-sans-ui mb-2 text-xs text-red-700">
                      This tab has {counts[t.key] ?? 0} {(counts[t.key] ?? 0) === 1 ? "catalogue" : "catalogues"} in
                      it. Move them to:
                    </p>
                    <select
                      value={moveTo}
                      onChange={(e) => setMoveTo(e.target.value)}
                      disabled={busy}
                      className="font-sans-ui mb-3 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-red-400"
                    >
                      {catalogueTypes
                        .filter((o) => o.key !== t.key)
                        .map((o) => (
                          <option key={o.key} value={o.key}>
                            {o.label}
                          </option>
                        ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingDeleteKey(null)}
                        disabled={busy}
                        className="font-sans-ui flex-1 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-medium text-[var(--ink)] transition hover:border-[var(--ink)] disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void doDelete(t.key, moveTo)}
                        disabled={busy || !moveTo}
                        className="font-sans-ui flex-1 rounded-full bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                      >
                        Move &amp; Delete Tab
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && <p className="font-sans-ui mt-3 text-xs text-red-600">{error}</p>}
        </div>

        <form
          onSubmit={handleAdd}
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          className="flex items-center gap-2 border-t border-[var(--line)] p-6 pt-6"
        >
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="New tab name"
            disabled={busy}
            className="font-sans-ui w-0 flex-1 rounded-lg border border-[var(--line)] bg-[#F6F3E8] px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={busy || !newLabel.trim()}
            className="font-sans-ui shrink-0 rounded-full bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--accent)] hover:text-[var(--ink)] disabled:opacity-40"
          >
            + Add Tab
          </button>
        </form>
      </div>
    </div>
  );
}
