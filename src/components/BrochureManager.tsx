"use client";

import { useMemo, useRef, useState } from "react";
import type { Brochure, CatalogueType } from "@/lib/brochures";
import type { WebsiteLinkOptions } from "@/lib/websiteLink";
import type { CatalogueTypeDef } from "@/lib/catalogueTypes";
import { UploadBrochureModal } from "@/components/UploadBrochureModal";
import { BrochureCard } from "@/components/BrochureCard";
import { ManageTabsModal } from "@/components/ManageTabsModal";
import { ArrowForwardIcon } from "@/components/ArrowIcons";
import { QrCodeOverlay } from "@/components/QrCodeOverlay";
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

function QrIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3.5" y="3.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14.5" y="3.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3.5" y="14.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M14.5 15h3v3h-3zM20.5 15v6M14.5 20.5h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

// Heroicons' Cog6Tooth outline — the hand-drawn gear this replaced had
// uneven, slightly-misaligned teeth that read as visually broken/cut
// off at small sizes. This is a well-established, precisely-drawn icon
// design that stays clean and legible even small.
function GearIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        stroke="currentColor"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        stroke="currentColor"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
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
  const [galleryQrOpen, setGalleryQrOpen] = useState(false);
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
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={() => setGalleryQrOpen(true)}
            className="font-sans-ui inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[#F6F3E8] px-5 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--ink)]"
          >
            <QrIcon className="h-4.5 w-4.5" />
            Share Platform
          </button>
          <button
            onClick={() => setUploadOpen(true)}
            className="font-sans-ui hidden rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--accent)] hover:text-[var(--ink)] sm:inline-flex"
          >
            + Upload Catalogue
          </button>
        </div>
      </div>

      <div className="font-sans-ui mb-8 flex items-center gap-1 border-y border-[var(--line)] py-1">
        {/* min-w-0 lets this shrink below its content's natural width
            inside the flex row — without it, overflow-x-auto never
            kicks in and the row just grows, pushing the gear button off
            or wrapping the whole thing to a second line instead of
            scrolling like a slider. */}
        <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {catalogueTypes.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm whitespace-nowrap transition ${
                activeTab === key
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--ink)]/60 hover:text-[var(--ink)]"
              }`}
            >
              {label} <span className={activeTab === key ? "text-white/60" : "text-[var(--ink)]/40"}>{countByType[key] ?? 0}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setManageTabsOpen(true)}
          aria-label="Manage tabs"
          title="Manage tabs"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--ink)]/40 transition hover:bg-[var(--paper-2)]/60 hover:text-[var(--ink)]"
        >
          <GearIcon className="h-5 w-5" />
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

      {galleryQrOpen && (
        <QrCodeOverlay
          url={typeof window !== "undefined" ? `${window.location.origin}/gallery` : ""}
          title="SRS Catalogue Hub"
          onClose={() => setGalleryQrOpen(false)}
          fixed
        />
      )}

      {toast && <Toast key={toast} message={toast} />}
    </div>
  );
}
