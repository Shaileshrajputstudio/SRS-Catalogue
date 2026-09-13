"use client";

import { useEffect, useRef, useState } from "react";
import { WhatsAppIcon, EmailIcon } from "@/components/ConnectIcons";
import type { Brochure } from "@/lib/brochures";
import { PdfPreview } from "@/components/PdfPreview";
import { ArrowOutwardIcon } from "@/components/ArrowIcons";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

function CloseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CopyIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9.5 14.5 14.5 9.5M11 7.5l1.4-1.4a3.5 3.5 0 0 1 5 5L16 12.5M13 16.5l-1.4 1.4a3.5 3.5 0 0 1-5-5L8 11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The admin panel's share popup for one brochure — left pane previews the
// actual PDF, right pane has the link, editable message, and Send via
// WhatsApp / Email. Tags, website link, and delete all live in the
// card's own "⋮" menu, not here — this stays focused on the one job of
// sharing. Opens from clicking a card in BrochureManager.
export function ShareModal({
  brochure,
  onClose,
}: {
  brochure: Brochure;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  useBodyScrollLock(true);

  useEffect(() => {
    const fullUrl = `${window.location.origin}/brochure/${brochure.id}`;
    setUrl(fullUrl);
    setMessage(
      `Hi\n\nSharing the ${brochure.title} catalogue from Shailesh Rajput Studio. Take a look whenever suits you. Happy to talk through any piece that catches your eye.\n\nRegards,\nTeam SRS`,
    );
    setCopied(false);
  }, [brochure]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function copyUrl() {
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      return;
    } catch {
      // Clipboard API can be denied — fall back to select + legacy copy
      // before giving up and just asking the user to copy manually.
    }
    const input = urlInputRef.current;
    input?.focus();
    input?.select();
    try {
      const ok = document.execCommand("copy");
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        return;
      }
    } catch {
      // fall through to manual-copy messaging below
    }
    setCopyFailed(true);
    setTimeout(() => setCopyFailed(false), 3000);
  }

  // Always the editable text plus the locked link, in that order — never
  // just `message` alone, so there's no way to send without the link.
  function fullMessage() {
    return `${message}\n\n${url}`;
  }

  function sendWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage())}`, "_blank");
  }

  function sendEmail() {
    window.open(
      `mailto:?subject=${encodeURIComponent(brochure.title)}&body=${encodeURIComponent(fullMessage())}`,
      "_blank",
    );
  }

  return (
    <div
      className="animate-backdrop-in fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:px-4 sm:py-8"
      onClick={onClose}
    >
      <div
        className="animate-sheet-up flex h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-[var(--paper)] shadow-2xl sm:h-[75vh] sm:flex-row sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left — a brand-styled preview (own page controls, no native PDF chrome). */}
        <div className="hidden h-full min-w-0 flex-1 border-r border-[var(--line)] bg-[var(--paper-2)] sm:block">
          <PdfPreview url={brochure.url} title={brochure.title} />
        </div>

        {/* Right — link, message, send. */}
        <div
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          className="flex w-full flex-1 flex-col overflow-y-auto p-6 sm:w-[380px] sm:flex-none"
        >
          <div className="mx-auto mb-2 h-1.5 w-10 shrink-0 rounded-full bg-[var(--ink)]/15 sm:hidden" />
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-sans-ui mb-1 text-xs tracking-[0.2em] text-[var(--ash)] uppercase">
                Share
              </p>
              <h2 className="truncate text-xl text-[var(--ink)]">{brochure.title}</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--ink)]/60 transition hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
            >
              <CloseIcon className="h-4.5 w-4.5" />
            </button>
          </div>

          <a
            href={brochure.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans-ui mb-5 inline-flex items-center gap-1 text-xs font-medium text-[var(--ink)]/60 underline-offset-2 hover:text-[var(--ink)] hover:underline sm:hidden"
          >
            Open PDF in a new tab
            <ArrowOutwardIcon className="h-3 w-3" />
          </a>

          <label className="font-sans-ui mb-2 block text-xs tracking-[0.2em] text-[var(--ash)] uppercase">
            Link
          </label>
          <div className="mb-2 flex items-center gap-2">
            <input
              ref={urlInputRef}
              readOnly
              value={url}
              onFocus={(e) => e.target.select()}
              className="font-sans-ui w-0 flex-1 truncate rounded-lg border border-[var(--line)] bg-[#F6F3E8] px-3 py-2.5 text-xs text-[var(--ink)]/70 outline-none"
            />
            <button
              onClick={copyUrl}
              className={`font-sans-ui flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-medium transition ${
                copied
                  ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                  : "border-[var(--line)] bg-[#F6F3E8] text-[var(--ink)] hover:border-[var(--ink)]"
              }`}
            >
              {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          {copyFailed && (
            <p className="font-sans-ui mb-3 text-xs text-red-600">
              Couldn&apos;t copy automatically — the link is selected above, press ⌘C / Ctrl+C to
              copy it.
            </p>
          )}

          <label
            htmlFor="share-message"
            className="font-sans-ui mb-2 block text-xs tracking-[0.2em] text-[var(--ash)] uppercase"
          >
            Message
          </label>
          <textarea
            id="share-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="font-sans-ui min-h-[140px] w-full flex-1 resize-none rounded-t-lg border border-b-0 border-[var(--line)] bg-[#F6F3E8] px-4 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]"
          />
          {/* The link itself, shown locked onto the bottom of the message box
              rather than left editable inside it — so it's obviously part of
              what gets sent, but can't be deleted by whoever's editing the
              text above it. */}
          <div className="font-sans-ui mb-5 flex items-center gap-2 rounded-b-lg border border-[var(--line)] bg-[var(--paper-2)]/60 px-4 py-2.5 text-xs text-[var(--ink)]/60">
            <LinkIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{url}</span>
            <span className="ml-auto shrink-0 text-[var(--ink)]/40">Always included</span>
          </div>

          <div className="font-sans-ui mb-6 grid grid-cols-2 gap-3">
            <button
              onClick={sendWhatsApp}
              className="flex items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)] hover:text-[var(--ink)]"
            >
              <WhatsAppIcon className="h-5 w-5 shrink-0" />
              WhatsApp
            </button>
            <button
              onClick={sendEmail}
              className="flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[#F6F3E8] px-5 py-3 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--ink)]"
            >
              <EmailIcon className="h-5 w-5 shrink-0" />
              Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
