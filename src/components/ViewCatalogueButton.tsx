"use client";

import { useEffect, useState } from "react";
import { PdfPreview } from "@/components/PdfPreview";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

function CloseIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// The customer-facing "open the catalogue" button. It used to be a plain
// link that opened the raw PDF in a new tab — on a phone that meant tapping
// and then seeing nothing (a multi-MB download starting silently, or a
// blank tab) with no way for this page to say it was working. Opening the
// catalogue in-page instead keeps a visible loading state (percent, then
// "preparing page") on screen the whole time, and the size on the button
// sets the expectation up front.
export function ViewCatalogueButton({
  url,
  title,
  sizeBytes,
}: {
  url: string;
  title: string;
  sizeBytes?: number;
}) {
  const [open, setOpen] = useState(false);
  useBodyScrollLock(open);

  // Back button (browser or Android) closes the viewer instead of leaving
  // the page — a history entry stands in for the overlay while it's open.
  useEffect(() => {
    if (!open) return;
    history.pushState({ catalogueViewer: true }, "");
    const onPop = () => setOpen(false);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open]);

  function close() {
    if (history.state?.catalogueViewer) history.back();
    else setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-sans-ui inline-flex items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)] hover:text-[var(--ink)]"
      >
        View / Download Catalogue (PDF)
        {sizeBytes ? (
          <span className="shrink-0 whitespace-nowrap text-white/60 tabular-nums">{formatSize(sizeBytes)}</span>
        ) : null}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-[60] flex flex-col bg-[var(--paper)]"
        >
          <div className="font-sans-ui flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
            <p className="min-w-0 truncate text-sm text-[var(--ink)]">{title}</p>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={url}
                download={`${title}.pdf`}
                className="rounded-full border border-[var(--line)] bg-[#F6F3E8] px-4 py-2 text-xs font-medium text-[var(--ink)] transition hover:border-[var(--ink)]"
              >
                Download PDF
              </a>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink)]/60 transition hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
              >
                <CloseIcon />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 bg-[var(--paper-2)]">
            <PdfPreview url={url} title={title} hideDownload />
          </div>
        </div>
      )}
    </>
  );
}
