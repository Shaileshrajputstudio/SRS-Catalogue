"use client";

import { useId, useState } from "react";

function CheckIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Chips + a text input, used both at upload and when editing an existing
// brochure. Press Enter or "," — or tap Apply — to add whatever's typed;
// existing tags across the library are offered via the native datalist
// so it's easy to reuse an exact tag (e.g. "USA") instead of retyping a
// near-miss. Removing an existing tag is a two-tap confirm (✕ then ✓)
// rather than instant, since that's a real data change, not a draft.
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
  const listId = useId();
  const atLimit = maxTags !== undefined && tags.length >= maxTags;

  function commit() {
    const clean = draft.trim();
    setDraft("");
    if (!clean || atLimit) return;
    if (tags.some((t) => t.toLowerCase() === clean.toLowerCase())) return;
    onChange([...tags, clean]);
  }

  function removeTag(tag: string) {
    setConfirmingTag(null);
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div>
      {/* Fixed-height even when empty, so a tag appearing/disappearing
          doesn't shift everything below it in the popup. */}
      <div className="mb-2 flex min-h-[30px] flex-wrap items-center gap-1.5">
        {tags.map((tag) => {
          const confirming = confirmingTag === tag;
          return (
            <span
              key={tag}
              className={`font-sans-ui inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                confirming
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-[var(--line)] bg-[#F6F3E8]/70 text-[var(--ink)]"
              }`}
            >
              {confirming ? "Remove?" : tag}
              {confirming ? (
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`Confirm remove tag ${tag}`}
                    className="text-red-600 transition-colors hover:text-red-800"
                  >
                    <CheckIcon className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingTag(null)}
                    aria-label="Cancel"
                    className="text-[var(--ink)]/40 transition-colors hover:text-[var(--ink)]"
                  >
                    ✕
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                  className="text-[var(--ink)]/40 transition-colors hover:text-[var(--ink)]"
                >
                  ✕
                </button>
              )}
            </span>
          );
        })}
      </div>
      {!atLimit && (
        <div className="flex items-center gap-2">
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
