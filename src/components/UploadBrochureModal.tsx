"use client";

import { useEffect, useRef, useState } from "react";
import { uploadToR2 } from "@/lib/r2Client";
import { buildBrochurePathname, buildThumbnailPathname, type Brochure, type CatalogueType } from "@/lib/brochures";
import type { WebsiteLink, WebsiteLinkOptions } from "@/lib/websiteLink";
import { renderFirstPageToPng } from "@/lib/pdfThumbnail";
import { PdfIcon } from "@/components/PdfIcon";
import { TagInput } from "@/components/TagInput";
import { updateBrochureTags, updateBrochureWebsiteLink, updateBrochureType } from "@/app/actions/brochures";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

const CATALOGUE_TYPE_LABELS: Record<CatalogueType, string> = {
  product: "Product",
  story: "Story",
  general: "General",
};

function UploadCloudIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 18a4.5 4.5 0 0 1-.5-8.98A5.5 5.5 0 0 1 17.3 8.02 4 4 0 0 1 17 16h-1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 11v8m0-8 3 3m-3-3-3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// The only way a brochure gets created: give it a title, choose the PDF,
// upload. Goes straight from the browser to Vercel Blob (not through a
// Server Action) — real brochures run several MB, past Vercel's fixed
// 4.5MB request-body limit for Functions. A cover-page thumbnail is
// rendered client-side (pdfjs-dist) and uploaded alongside the PDF — if
// that step fails for any reason, the brochure still gets created, just
// without a thumbnail, rather than blocking the whole upload on it.
export function UploadBrochureModal({
  allTags,
  websiteLinkOptions,
  onClose,
  onUploaded,
}: {
  allTags: string[];
  websiteLinkOptions: WebsiteLinkOptions;
  onClose: () => void;
  onUploaded: (brochure: Brochure) => void;
}) {
  useBodyScrollLock(true);
  const [title, setTitle] = useState("");
  const [catalogueType, setCatalogueType] = useState<CatalogueType | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [linkSelection, setLinkSelection] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBusy = progress !== null;

  // Close on Escape, same as ShareModal — but not mid-upload, matching the
  // backdrop-click guard below.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isBusy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, isBusy]);

  function pickFile() {
    if (isBusy) return;
    fileInputRef.current?.click();
  }

  function chooseFile(chosen: File | null | undefined) {
    if (!chosen) return;
    if (chosen.type !== "application/pdf") {
      setError("That doesn't look like a PDF — please choose a .pdf file.");
      return;
    }
    setError(null);
    setFile(chosen);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (isBusy) return;
    chooseFile(e.dataTransfer.files?.[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isBusy) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Give the catalogue a title.");
      return;
    }
    if (!catalogueType) {
      setError("Choose a catalogue type — Product, Story, or General.");
      return;
    }
    if (catalogueType !== "general" && !linkSelection) {
      setError("Choose a website link — or “No Website Link” if it doesn't apply.");
      return;
    }
    if (!file) {
      setError("Choose a PDF file.");
      return;
    }

    setError(null);
    setProgress(0);
    const id = crypto.randomUUID().slice(0, 8);

    try {
      setStatusText("Uploading…");
      const blob = await uploadToR2(buildBrochurePathname(id, trimmedTitle), file, {
        contentType: "application/pdf",
        onUploadProgress: ({ percentage }) => setProgress(percentage),
      });

      let thumbnailUrl: string | undefined;
      try {
        setStatusText("Generating cover thumbnail…");
        const thumbBlob = await renderFirstPageToPng(file);
        const uploadedThumb = await uploadToR2(buildThumbnailPathname(id), thumbBlob, {
          contentType: "image/png",
        });
        thumbnailUrl = uploadedThumb.url;
      } catch {
        // Non-fatal — the brochure works fine without a thumbnail.
      }

      let savedTags: string[] = [];
      if (tags.length > 0) {
        try {
          setStatusText("Saving tags…");
          savedTags = await updateBrochureTags(id, tags);
        } catch {
          // Non-fatal — the brochure works fine without tags, they can be
          // added afterward from the share modal.
        }
      }

      let savedLink: WebsiteLink | null = null;
      if (catalogueType !== "general") {
        try {
          setStatusText("Saving website link…");
          savedLink = await updateBrochureWebsiteLink(id, linkSelection);
        } catch {
          // Non-fatal — the brochure still gets created.
        }
      }

      let savedType: CatalogueType = catalogueType;
      try {
        setStatusText("Saving catalogue type…");
        savedType = await updateBrochureType(id, catalogueType);
      } catch {
        // Non-fatal — the brochure still gets created.
      }

      onUploaded({
        id,
        title: trimmedTitle,
        url: blob.url,
        thumbnailUrl,
        tags: savedTags,
        websiteLink: savedLink,
        catalogueType: savedType,
        uploadedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed — please try again.");
      setProgress(null);
      setStatusText(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={isBusy ? undefined : onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-[var(--paper)] p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="text-xl text-[var(--ink)]">Upload Catalogue</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Close"
            className="font-sans-ui shrink-0 text-lg text-[var(--ink)]/50 hover:text-[var(--ink)] disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        <label
          htmlFor="brochure-title"
          className="font-sans-ui mb-2 block text-xs tracking-[0.2em] text-[var(--ash)] uppercase"
        >
          Title
        </label>
        <input
          id="brochure-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Table Lights Collection"
          disabled={isBusy}
          className="font-sans-ui mb-5 w-full rounded-lg border border-[var(--line)] bg-[#F6F3E8] px-4 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)] disabled:opacity-60"
        />

        <label className="font-sans-ui mb-2 block text-xs tracking-[0.2em] text-[var(--ash)] uppercase">
          Catalogue Type
        </label>
        <div className="mb-5 grid grid-cols-3 gap-2">
          {(Object.keys(CATALOGUE_TYPE_LABELS) as CatalogueType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setCatalogueType(t);
                setLinkSelection("");
              }}
              disabled={isBusy}
              className={`font-sans-ui rounded-lg border px-4 py-2.5 text-sm font-medium transition disabled:opacity-60 ${
                catalogueType === t
                  ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                  : "border-[var(--line)] bg-[#F6F3E8] text-[var(--ink)] hover:border-[var(--ink)]"
              }`}
            >
              {CATALOGUE_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <label className="font-sans-ui mb-2 block text-xs tracking-[0.2em] text-[var(--ash)] uppercase">
          Tags <span className="normal-case tracking-normal text-[var(--ink)]/40">(optional — e.g. region or pricing)</span>
        </label>
        <div className="mb-5">
          <TagInput tags={tags} onChange={setTags} suggestions={allTags} maxTags={1} />
        </div>

        {catalogueType !== "general" && (
          <>
            <label
              htmlFor="brochure-category"
              className="font-sans-ui mb-2 block text-xs tracking-[0.2em] text-[var(--ash)] uppercase"
            >
              Website Link
            </label>
            <div className="relative mb-5">
              <select
                id="brochure-category"
                value={linkSelection}
                onChange={(e) => setLinkSelection(e.target.value)}
                disabled={isBusy}
                required
                className="font-sans-ui w-full appearance-none rounded-lg border border-[var(--line)] bg-[#F6F3E8] px-4 py-3 pr-10 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)] disabled:opacity-60"
              >
                <option value="" disabled>
                  Choose a website link…
                </option>
                <option value="_none_">No Website Link</option>
                {catalogueType === "product" && (
                  <optgroup label="Product Category">
                    {websiteLinkOptions.categories.map((c) => (
                      <option key={c} value={`category|${c}`}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                )}
                {catalogueType === "story" && (
                  <optgroup label="Story">
                    {websiteLinkOptions.stories.map((s) => (
                      <option key={s.slug} value={`story|${s.slug}`}>
                        {s.title}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-[var(--ink)]/50"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </>
        )}

        <label className="font-sans-ui mb-2 block text-xs tracking-[0.2em] text-[var(--ash)] uppercase">
          PDF File
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => chooseFile(e.target.files?.[0])}
          className="hidden"
        />
        <button
          type="button"
          onClick={pickFile}
          onDragOver={(e) => {
            e.preventDefault();
            if (!isBusy) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          disabled={isBusy}
          className={`font-sans-ui mb-5 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition disabled:opacity-60 ${
            isDragging
              ? "border-[var(--ink)] bg-[var(--paper-2)]/40"
              : "border-[var(--line)] hover:border-[var(--ink)]/50"
          }`}
        >
          {file ? (
            <>
              <PdfIcon className="h-8 w-8 text-[var(--ink)]" />
              <p className="max-w-full truncate text-sm text-[var(--ink)]">{file.name}</p>
              <p className="text-xs text-[var(--ink)]/50">{formatSize(file.size)} — click to change</p>
            </>
          ) : (
            <>
              <UploadCloudIcon className="h-7 w-7 text-[var(--ink)]/50" />
              <p className="text-sm text-[var(--ink)]">
                <span className="font-medium underline underline-offset-2">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-[var(--ink)]/50">PDF, any size</p>
            </>
          )}
        </button>

        {error && <p className="font-sans-ui mb-4 text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isBusy}
          className="font-sans-ui w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)] hover:text-[var(--ink)] disabled:opacity-60"
        >
          {progress !== null && progress < 100
            ? `Uploading… ${progress}%`
            : statusText ?? "Upload"}
        </button>
      </form>
    </div>
  );
}
