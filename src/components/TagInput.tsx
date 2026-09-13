"use client";

import { useId, useState } from "react";

// Chips + a text input, used both at upload and when editing an existing
// brochure. Press Enter or "," to add whatever's typed; existing tags
// across the library are offered via the native datalist so it's easy to
// reuse an exact tag (e.g. "USA") instead of retyping a near-miss.
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
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div>
      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="font-sans-ui inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[#F6F3E8]/70 px-3 py-1 text-xs text-[var(--ink)]"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
                className="text-[var(--ink)]/40 hover:text-[var(--ink)]"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      {!atLimit && (
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
          onBlur={commit}
          placeholder="Add a tag and press Enter"
          className="font-sans-ui w-full rounded-lg border border-[var(--line)] bg-[#F6F3E8] px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
        />
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
