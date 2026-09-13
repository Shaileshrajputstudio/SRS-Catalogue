"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Brochure } from "@/lib/brochures";
import { buildBrochurePathname } from "@/lib/brochures";
import { deleteBrochure, updateBrochureTags } from "@/app/actions/brochures";
import { PdfIcon } from "@/components/PdfIcon";
import { TagInput } from "@/components/TagInput";
import { ShareModal } from "@/components/ShareModal";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function DotsIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="5" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="12" cy="19" r="1.75" />
    </svg>
  );
}

function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
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

// One card in the library grid — clicking it opens the share popup; the
// "⋮" menu sits on top of the image for tags, website link, and delete,
// so those stay reachable without opening that popup at all.
export function BrochureCard({
  brochure,
  allTags,
  onDeleted,
  onTagsSaved,
}: {
  brochure: Brochure;
  allTags: string[];
  onDeleted: (id: string) => void;
  onTagsSaved: (id: string, tags: string[]) => void;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tags, setTags] = useState(brochure.tags);
  const [tagsDirty, setTagsDirty] = useState(false);
  const [isSavingTags, startTagsTransition] = useTransition();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function saveTags() {
    startTagsTransition(async () => {
      const saved = await updateBrochureTags(brochure.id, tags);
      setTags(saved);
      setTagsDirty(false);
      onTagsSaved(brochure.id, saved);
    });
  }

  function confirmRemove() {
    startDeleteTransition(async () => {
      await deleteBrochure(buildBrochurePathname(brochure.id, brochure.title), brochure.id);
      onDeleted(brochure.id);
    });
  }

  return (
    <div className="group relative">
      <button type="button" onClick={() => setShareOpen(true)} className="block w-full text-left">
        <div className="relative mb-2 flex aspect-[297/210] items-center justify-center overflow-hidden rounded-xl border border-[var(--line)] bg-white">
          {brochure.thumbnailUrl ? (
            <Image
              src={brochure.thumbnailUrl}
              alt={brochure.title}
              width={800}
              height={566}
              unoptimized
              className="h-full w-full object-cover transition group-hover:opacity-80"
            />
          ) : (
            <PdfIcon className="h-10 w-10 text-[var(--line)]" />
          )}

          {tags.length > 0 && (
            <div className="font-sans-ui pointer-events-none absolute top-2 left-2 flex max-w-[calc(100%-3.5rem)] flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <p className="font-sans-ui truncate text-lg text-[var(--ink)]">{brochure.title}</p>
        <p className="font-sans-ui text-xs font-medium text-[var(--ink)]/50">{formatDate(brochure.uploadedAt)}</p>
      </button>

      {shareOpen && <ShareModal brochure={brochure} onClose={() => setShareOpen(false)} />}

      <div ref={menuRef} className="absolute top-2 right-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          aria-label="Brochure options"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
        >
          <DotsIcon className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="font-sans-ui absolute top-full right-0 z-20 mt-2 w-72 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 text-left shadow-2xl"
          >
            <label className="mb-2 block text-xs tracking-[0.2em] text-[var(--ash)] uppercase">
              Tags
            </label>
            <TagInput
              tags={tags}
              onChange={(next) => {
                setTags(next);
                setTagsDirty(true);
              }}
              suggestions={allTags}
            />
            {tagsDirty && (
              <button
                onClick={saveTags}
                disabled={isSavingTags}
                className="mt-2 w-full rounded-full border border-[var(--ink)] px-4 py-2 text-xs font-medium text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-white disabled:opacity-50"
              >
                {isSavingTags ? "Saving tags…" : "Save tags"}
              </button>
            )}

            <label className="mt-4 mb-2 block text-xs tracking-[0.2em] text-[var(--ash)] uppercase">
              Website Link
            </label>
            <p className="text-sm text-[var(--ink)]">
              {brochure.websiteLink ? brochure.websiteLink.label : "No Website Link"}
            </p>
            <p className="mt-1 text-xs text-[var(--ink)]/50">Set at upload — not editable here.</p>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setConfirmingRemove(true);
              }}
              className="mt-4 flex w-full items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Remove this brochure
            </button>
          </div>
        )}
      </div>

      {confirmingRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => {
            e.preventDefault();
            setConfirmingRemove(false);
          }}
        >
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="font-sans-ui w-full max-w-sm rounded-2xl bg-[var(--paper)] p-6 shadow-2xl"
          >
            <h3 className="mb-2 text-lg text-[var(--ink)]">Remove brochure?</h3>
            <p className="mb-5 text-sm text-[var(--ink)]/70">
              Remove &ldquo;{brochure.title}&rdquo;? This can&apos;t be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingRemove(false)}
                disabled={isDeleting}
                className="flex-1 rounded-full border border-[var(--line)] bg-[var(--paper-2)] px-4 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--ink)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                disabled={isDeleting}
                className="flex-1 rounded-full bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
