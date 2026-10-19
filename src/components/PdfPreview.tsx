"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { ArrowOutwardIcon } from "@/components/ArrowIcons";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.25;

const iconButtonClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9 text-[var(--ink)]/70 transition hover:bg-[var(--ink)]/8 hover:text-[var(--ink)] disabled:opacity-25 disabled:hover:bg-transparent";

function Divider() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-[var(--line)] sm:mx-1.5" aria-hidden="true" />;
}

function ChevronLeftIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RotateIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 9a8 8 0 1 1 1.35 8.65"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 4v5h5" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ZoomOutIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.25" />
      <path d="M21 21l-4.3-4.3M8 11h6" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

function ZoomInIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.25" />
      <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3v12m0 0 4-4m-4 4-4-4"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// A brand-styled PDF preview rendered entirely client-side onto a canvas
// (pdfjs-dist) — replaces the raw browser-native PDF viewer (its own
// toolbar, print/download icons, zoom controls) that looked out of place
// dropped into a branded modal. The page itself, on paper, with our own
// toolbar: rotate, zoom, page navigation, download.
export function PdfPreview({
  url,
  title,
  hideDownload = false,
}: {
  url: string;
  title: string;
  // The customer viewer already has a Download PDF button in its header.
  hideDownload?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const loadingTaskRef = useRef<{ destroy: () => Promise<void> } | null>(null);
  const renderTokenRef = useRef(0);

  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  // The document opens (isLoading false) long before the current page has
  // actually been fetched and drawn — without this the viewer sat on a
  // blank white page for seconds with nothing saying it was working.
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  // Load the document once per url — also resets page/zoom/rotation, since
  // those apply to whichever document is currently open.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setProgress(null);
    setError(null);
    setErrorDetail(null);
    setPage(1);
    setZoom(1);
    setRotation(0);
    pdfRef.current = null;

    (async () => {
      try {
        // Legacy build on purpose: the standard one assumes very recent
        // JavaScript (Promise.withResolvers, Math.sumPrecise, ...) and
        // simply fails to start on iPhones that haven't updated iOS, which
        // is exactly where customers open a catalogue link from WhatsApp.
        // The legacy build bundles the polyfills for those.
        await import("@/lib/pdfPolyfills");
        const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.legacy.min.mjs";
        const loadingTask = pdfjsLib.getDocument({ url });
        loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
          if (!cancelled && total) setProgress(Math.min(100, Math.round((loaded / total) * 100)));
        };
        loadingTaskRef.current = loadingTask;
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setIsLoading(false);
      } catch (err) {
        console.error("PdfPreview: failed to load", err);
        if (!cancelled) {
          setError("Couldn't load a preview for this file.");
          setErrorDetail(err instanceof Error ? err.message : String(err));
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      loadingTaskRef.current?.destroy?.();
    };
  }, [url]);

  // Render the current page onto the canvas — fit to the available width by
  // default, then scaled further by zoom/rotation (capped for crispness on
  // high-DPI screens).
  useEffect(() => {
    if (isLoading || error || !pdfRef.current || !viewportRef.current || !canvasRef.current) return;
    const token = ++renderTokenRef.current;
    setPageLoading(true);

    (async () => {
      try {
        const pdfPage = await pdfRef.current!.getPage(page);
        if (renderTokenRef.current !== token) return;

        const canvas = canvasRef.current!;
        const available = viewportRef.current!.clientWidth - 48;
        const baseViewport = pdfPage.getViewport({ scale: 1, rotation });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const fitScale = Math.min(available / baseViewport.width, 2);
        const cssScale = fitScale * zoom;
        const viewport = pdfPage.getViewport({ scale: cssScale * dpr, rotation });

        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        canvas.style.width = `${Math.round(viewport.width / dpr)}px`;
        canvas.style.height = `${Math.round(viewport.height / dpr)}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        await pdfPage.render({ canvas, canvasContext: ctx, viewport }).promise;
      } finally {
        if (renderTokenRef.current === token) setPageLoading(false);
      }
    })();
  }, [page, isLoading, error, zoom, rotation]);

  function goPrev() {
    setPage((p) => Math.max(1, p - 1));
  }
  function goNext() {
    setPage((p) => Math.min(numPages, p + 1));
  }
  function zoomOut() {
    setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));
  }
  function zoomIn() {
    setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  }
  function rotate() {
    setRotation((r) => (r + 90) % 360);
  }
  function downloadPdf() {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = e.touches.length === 1 && zoom <= 1 ? { x: t.clientX, y: t.clientY } : null;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) goNext();
      else goPrev();
    }
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") goPrev();
    if (e.key === "ArrowRight") goNext();
  }

  return (
    <div className="flex h-full min-w-0 flex-col outline-none" tabIndex={0} onKeyDown={onKeyDown}>
      <div
        ref={viewportRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative flex min-w-0 flex-1 items-center justify-center overflow-auto p-6"
      >
        {isLoading && (
          <div className="font-sans-ui flex flex-col items-center gap-3 text-center text-xs text-[var(--ink)]/50">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink)]/15 border-t-[var(--ink)]/50" />
            <span>
              Loading catalogue…{progress !== null && <span className="tabular-nums"> {progress}%</span>}
            </span>
            {progress !== null && (
              <span className="block h-1 w-40 overflow-hidden rounded-full bg-[var(--ink)]/10">
                <span
                  className="block h-full rounded-full bg-[var(--ink)]/50 transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </span>
            )}
            <span className="max-w-[220px] text-[var(--ink)]/35">
              It&apos;s a large file, thanks for waiting.
            </span>
          </div>
        )}
        {!isLoading && !error && pageLoading && (
          <div className="font-sans-ui pointer-events-none absolute top-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[var(--paper)]/90 px-3 py-1.5 text-xs text-[var(--ink)]/60 shadow-sm backdrop-blur">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--ink)]/15 border-t-[var(--ink)]/60" />
            Preparing page {page}…
          </div>
        )}
        {error && (
          <div className="font-sans-ui flex max-w-[260px] flex-col items-center gap-4 text-center text-xs text-[var(--ink)]/60">
            <p>{error}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--accent)] hover:text-[var(--ink)]"
            >
              Open the PDF
              <ArrowOutwardIcon className="h-3.5 w-3.5" />
            </a>
            {errorDetail && (
              <p className="max-w-full break-words text-[10px] text-[var(--ink)]/30">{errorDetail}</p>
            )}
          </div>
        )}
        {!isLoading && !error && (
          <canvas ref={canvasRef} aria-label={`${title} — page ${page}`} className="rounded-sm bg-white shadow-lg" />
        )}
      </div>

      {!isLoading && !error && (
        <div className="font-sans-ui flex flex-wrap items-center justify-center gap-0.5 border-t border-[var(--line)] px-2 py-3 sm:gap-1.5 sm:px-4">
          <button type="button" onClick={rotate} aria-label="Rotate" className={iconButtonClass}>
            <RotateIcon />
          </button>

          <Divider />

          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
            className={iconButtonClass}
          >
            <ZoomOutIcon />
          </button>
          <span className="w-11 shrink-0 text-center text-sm tabular-nums text-[var(--ink)]/70 sm:w-12">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
            className={iconButtonClass}
          >
            <ZoomInIcon />
          </button>

          {numPages > 1 && (
            <>
              <Divider />
              <button
                type="button"
                onClick={goPrev}
                disabled={page <= 1}
                aria-label="Previous page"
                className={iconButtonClass}
              >
                <ChevronLeftIcon />
              </button>
              <span className="min-w-[3.25rem] shrink-0 text-center text-sm tabular-nums text-[var(--ink)]/70 sm:min-w-[3.75rem]">
                {page} / {numPages}
              </span>
              <button
                type="button"
                onClick={goNext}
                disabled={page >= numPages}
                aria-label="Next page"
                className={iconButtonClass}
              >
                <ChevronRightIcon />
              </button>
            </>
          )}

          {!hideDownload && (
            <>
              <Divider />
              <button type="button" onClick={downloadPdf} aria-label="Download" className={iconButtonClass}>
                <DownloadIcon />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
