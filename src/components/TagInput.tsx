"use client";

import { useId, useRef, useState } from "react";

// How long the "×" (enter confirm mode) is disabled right after a tag
// is committed, and how long the "✓" (actually remove) is disabled
// right after entering confirm mode. Both exist for the same reason:
// on mobile, tapping Apply and then tapping again a moment later (to
// dismiss the keyboard, or just out of habit) can land on whatever
// control the chip's remove button ends up under once the layout
// reflows — without these, that stray second tap can walk a
// just-added tag straight through "remove?" and into actually removed.
const JUST_ADDED_COOLDOWN_MS = 500;
const CONFIRM_COOLDOWN_MS = 350;

function CheckIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Chips + a text input, used both at upload and when editing an existing
// brochure. Press Enter or "," — or tap Apply — to add whatever's typed;
// existing tags across the library are offered via the native datalist
// so it's easy to reuse an exact tag (e.g. "USA") instead of retyping a
// near-miss. Removing an existing tag is a two-tap confirm (✕ then ✓)
// rather than instant, since that's a real data change, not a draft.
//
// The chips and the input+Apply row are rendered as alternatives in one
// shared slot (never stacked) — since this app always uses maxTags={1},
// exactly one of them is ever visible at a time anyway. A single shared
// min-height on that slot keeps the popup's layout stable whether a tag
// is present or not, without reserving a separate always-empty row.
export function TagInput({
  tags,
  onChange,
  suggestions,
  maxTags,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  maxTags?: number;
}) {
  const [draft, setDraft] = useState("");
  const [confirmingTag, setConfirmingTag] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const [confirmReady, setConfirmReady] = useState(false);
  const justAddedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmReadyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = useId();
  const atLimit = maxTags !== undefined && tags.length >= maxTags;

  function commit() {
    const clean = draft.trim();
    setDraft("");
    if (!clean || atLimit) return;
    if (tags.some((t) => t.toLowerCase() === clean.toLowerCase())) return;
    onChange([...tags, clean]);
    setJustAdded(true);
    if (justAddedTimer.current) clearTimeout(justAddedTimer.current);
    justAddedTimer.current = setTimeout(() => setJustAdded(false), JUST_ADDED_COOLDOWN_MS);
  }

  function startConfirm(tag: string) {
    if (justAdded) return;
    setConfirmingTag(tag);
    setConfirmReady(false);
    if (confirmReadyTimer.current) clearTimeout(confirmReadyTimer.current);
    confirmReadyTimer.current = setTimeout(() => setConfirmReady(true), CONFIRM_COOLDOWN_MS);
  }

  function cancelConfirm() {
    setConfirmingTag(null);
    setConfirmReady(false);
    if (confirmReadyTimer.current) clearTimeout(confirmReadyTimer.current);
  }

  function removeTag(tag: string) {
    if (!confirmReady) return;
    cancelConfirm();
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div>
      <div className="flex min-h-[48px] flex-wrap items-center gap-1.5">
        {tags.map((tag) => {
          const confirming = confirmingTag === tag;
          // Confirming gets its own full-width bar rather than trying to
          // cram a "Remove?" label and two buttons into the same small
          // pill the resting chip uses — that read as cramped and made
          // the confirm/cancel targets small. This spells out which tag
          // and gives both buttons real touch-target size with a clear
          // gap between them.
          if (confirming) {
            return (
              <div
                key={tag}
                className="font-sans-ui flex w-full items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 py-1.5 pr-1.5 pl-4"
              >
                <span className="text-sm font-medium text-red-700">Remove &ldquo;{tag}&rdquo;?</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    disabled={!confirmReady}
                    aria-label={`Confirm remove tag ${tag}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-100 hover:text-red-800 disabled:cursor-not-allowed disabled:text-red-300 disabled:hover:bg-transparent"
                  >
                    <CheckIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelConfirm}
                    aria-label="Cancel"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--ink)]/50 transition-colors hover:bg-[var(--ink)]/10 hover:text-[var(--ink)]"
                  >
                    <CloseIcon className="h-5 w-5" />
                  </button>
                </span>
              </div>
            );
          }
          return (
            <span
              key={tag}
              className="font-sans-ui inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[#F6F3E8]/70 py-2 pr-2 pl-4 text-sm text-[var(--ink)]"
            >
              {tag}
              <button
                type="button"
                onClick={() => startConfirm(tag)}
                disabled={justAdded}
                aria-label={`Remove tag ${tag}`}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink)]/40 transition-colors hover:bg-[var(--ink)]/5 hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </span>
          );
        })}
        {!atLimit && (
          <div className="flex w-full items-center gap-2">
            <input
              list={listId}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  commit();
                }
              }}
              placeholder="Add a tag"
              className="tag-input-no-indicator font-sans-ui w-0 flex-1 rounded-lg border border-[var(--line)] bg-[#F6F3E8] px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
            />
            <button
              type="button"
              onClick={commit}
              disabled={!draft.trim()}
              className="font-sans-ui shrink-0 text-sm font-medium text-[var(--ink)] underline-offset-2 transition-colors hover:underline disabled:text-[var(--ink)]/30 disabled:no-underline"
            >
              Apply
            </button>
          </div>
        )}
      </div>
      <datalist id={listId}>
        {suggestions
          .filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  );
}
