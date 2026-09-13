"use client";

import { useMemo, useRef, useState } from "react";
import type { Brochure, CatalogueType } from "@/lib/brochures";
import type { WebsiteLinkOptions } from "@/lib/websiteLink";
import type { CatalogueTypeDef } from "@/lib/catalogueTypes";
import { UploadBrochureModal } from "@/components/UploadBrochureModal";
import { BrochureCard } from "@/components/BrochureCard";
import { ManageTabsModal } from "@/components/ManageTabsModal";
import { ArrowForwardIcon } from "@/components/ArrowIcons";
import { Toast } from "@/components/Toast";

// A toast is visible for 2.6s (matches the CSS animation in
// globals.css) — showToast clears any still-running timer first so a
// second toast firing quickly doesn't get cut short by the first one's
// timeout.
const TOAST_DURATION_MS = 2600;

function PlusIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function EmptyLibraryIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="8" width="13" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.5 5h11a1.5 1.5 0 0 1 1.5 1.5V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.5 13h7M7.5 16.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GearIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2.06 2.06 0 1 1-2.92 2.92l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56v.17a2.06 2.06 0 1 1-4.12 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2.06 2.06 0 1 1-2.92-2.92l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03h-.17a2.06 2.06 0 1 1 0-4.12h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2.06 2.06 0 1 1 2.92-2.92l.06.06a1.7 1.7 0 0 0 1.87.34h.08a1.7 1.7 0 0 0 1.03-1.56v-.17a2.06 2.06 0 1 1 4.12 0v.09a1.7 1.7 0 0 0 1.03 1.56h.08a1.7 1.7 0 0 0 1.87-.34l.06-.06a2.06 2.06 0 1 1 2.92 2.92l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.56 1.03h.17a2.06 2.06 0 1 1 0 4.12h-.09a1.7 1.7 0 0 0-1.56 1.03Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// "All" isn't a real tab — every brochure has exactly one type, so
// whatever's in catalogueTypes always partitions the library completely.

// The whole admin homepage: the heading, the "+ Upload Brochure" CTA, and
// the library itself all live in one client component so the CTA can sit
// next to the heading (not buried lower) while still sharing state with
// the upload modal and the type tabs below it.
export function BrochureManager({
  initialBrochures,
  websiteLinkOptions,
  initialCatalogueTypes,
}: {
  initialBrochures: Brochure[];
  websiteLinkOptions: WebsiteLinkOptions;
  initialCatalogueTypes: CatalogueTypeDef[];
}) {
  const [brochures, setBrochures] = useState(initialBrochures);
  const [catalogueTypes, setCatalogueTypes] = useState(initialCatalogueTypes);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [manageTabsOpen, setManageTabsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CatalogueType>(
    initialCatalogueTypes[0]?.key ?? "general",
  );
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }

  // Every distinct tag already in use, for the tag-input's suggestions —
  // recomputed whenever the library changes.
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const b of brochures) for (const t of b.tags) set.add(t);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [brochures]);

  const countByType = useMemo(() => {
    const counts: Record<string, number> = Object.fromEntries(catalogueTypes.map((t) => [t.key, 0]));
    for (const b of brochures) counts[b.catalogueType] = (counts[b.catalogueType] ?? 0) + 1;
    return counts;
  }, [brochures, catalogueTypes]);

  const visible = useMemo(
    () => brochures.filter((b) => b.catalogueType === activeTab),
    [brochures, activeTab],
  );

  // Called after Manage Tabs adds/renames/reorders/deletes a tab — keeps
  // this component's own state in sync without a full page reload, same
  // pattern as handleUploaded/handleDeleted below.
  function handleTypesChanged(next: CatalogueTypeDef[]) {
    setCatalogueTypes(next);
    if (!next.some((t) => t.key === activeTab)) {
      setActiveTab(next[0]?.key ?? "general");
    }
  }

  // Deleting a non-empty tab re-types its catalogues server-side (see
  // deleteCatalogueType) — this mirrors that locally so the library view
  // doesn't need a reload to reflect where they landed.
  function handleBrochuresRetyped(fromKey: string, toKey: string) {
    setBrochures((prev) => prev.map((b) => (b.catalogueType === fromKey ? { ...b, catalogueType: toKey } : b)));
  }

  function handleUploaded(brochure: Brochure) {
    setBrochures((prev) => [brochure, ...prev]);
    setUploadOpen(false);
    setActiveTab(brochure.catalogueType);
    showToast(`"${brochure.title}" uploaded`);
  }

  function handleDeleted(id: string, title: string) {
    setBrochures((prev) => prev.filter((b) => b.id !== id));
    showToast(`"${title}" removed`);
  }

  function handleTagsSaved(id: string, tags: string[]) {
    setBrochures((prev) => prev.map((b) => (b.id === id ? { ...b, tags } : b)));
  }

  return (
    <div className="pb-24 sm:pb-0">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 max-w-xl text-2xl leading-tight text-[var(--ink)] sm:text-3xl">
            Where every catalogue lives.
          </h1>
          <p className="font-sans-ui text-[var(--ink)]/70">
            Upload once, the link never changes, ready whenever a client asks.
          </p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="font-sans-ui hidden shrink-0 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--accent)] hover:text-[var(--ink)] sm:inline-flex"
        >
          + Upload Catalogue
        </button>
      </div>

      <div className="font-sans-ui mb-8 flex flex-wrap items-center gap-1 border-y border-[var(--line)] py-1">
        {catalogueTypes.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              activeTab === key
                ? "bg-[var(--ink)] text-white"
                : "text-[var(--ink)]/60 hover:text-[var(--ink)]"
            }`}
          >
            {label} <span className={activeTab === key ? "text-white/60" : "text-[var(--ink)]/40"}>{countByType[key] ?? 0}</span>
          </button>
        ))}
        <button
          onClick={() => setManageTabsOpen(true)}
          aria-label="Manage tabs"
          title="Manage tabs"
          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--ink)]/40 transition hover:bg-[var(--paper-2)]/60 hover:text-[var(--ink)]"
        >
          <GearIcon className="h-4 w-4" />
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--line)] px-6 py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--paper-2)]/70">
            <EmptyLibraryIcon className="h-7 w-7 text-[var(--ink)]/45" />
          </div>
          <p className="font-sans-ui mb-4 text-sm text-[var(--ink)]/50">
            {brochures.length === 0
              ? "Nothing here yet — the first catalogue starts the library."
              : `No ${catalogueTypes.find((t) => t.key === activeTab)?.label.toLowerCase()} catalogues yet.`}
          </p>
          <button
            onClick={() => setUploadOpen(true)}
            className="font-sans-ui inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ink)] underline-offset-2 hover:underline"
          >
            Upload {brochures.length === 0 ? "your first catalogue" : "a catalogue"}
            <ArrowForwardIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((brochure) => (
            <BrochureCard
              key={brochure.id}
              brochure={brochure}
              allTags={allTags}
              onDeleted={handleDeleted}
              onTagsSaved={handleTagsSaved}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setUploadOpen(true)}
        aria-label="Upload Catalogue"
        style={{ bottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))" }}
        className="fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ink)] text-white shadow-lg transition active:scale-95 sm:hidden"
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      {uploadOpen && (
        <UploadBrochureModal
          allTags={allTags}
          websiteLinkOptions={websiteLinkOptions}
          catalogueTypes={catalogueTypes}
          onClose={() => setUploadOpen(false)}
          onUploaded={handleUploaded}
        />
      )}

      {manageTabsOpen && (
        <ManageTabsModal
          catalogueTypes={catalogueTypes}
          counts={countByType}
          onClose={() => setManageTabsOpen(false)}
          onTypesChange={handleTypesChanged}
          onBrochuresRetyped={handleBrochuresRetyped}
        />
      )}

      {toast && <Toast key={toast} message={toast} />}
    </div>
  );
}
