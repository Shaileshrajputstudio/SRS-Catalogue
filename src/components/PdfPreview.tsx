"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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


const PAGE_GAP = 16;
const MAX_CANVAS_PIXELS = 16_000_000;

// One page of the continuous scroll. Only renders while it is near the
// viewport and releases its bitmap when scrolled far away, so a 100+ page
// catalogue doesn't exhaust canvas memory on phones.
function PdfPage({
  pdf,
  pageNumber,
  rotation,
  width,
  defaultAspect,
  rootRef,
  title,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  rotation: number;
  width: number;
  defaultAspect: number;
  rootRef: React.RefObject<HTMLDivElement | null>;
  title: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);
  const [aspect, setAspect] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      root: rootRef.current,
      rootMargin: "1500px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [rootRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!near) {
      canvas.width = 0;
      canvas.height = 0;
      setDrawn(false);
      return;
    }

    let cancelled = false;
    let task: { promise: Promise<unknown>; cancel: () => void } | null = null;
    let pdfPage: Awaited<ReturnType<PDFDocumentProxy["getPage"]>> | null = null;

    (async () => {
      try {
        pdfPage = await pdf.getPage(pageNumber);
        if (cancelled) return;
        const base = pdfPage.getViewport({ scale: 1, rotation });
        const cssScale = width / base.width;
        let dpr = Math.min(window.devicePixelRatio || 1, 2);
        const area = base.width * base.height * (cssScale * dpr) ** 2;
        if (area > MAX_CANVAS_PIXELS) dpr *= Math.sqrt(MAX_CANVAS_PIXELS / area);
        const viewport = pdfPage.getViewport({ scale: cssScale * dpr, rotation });

        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${Math.round(base.height * cssScale)}px`;
        setAspect(base.height / base.width);

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        task = pdfPage.render({ canvas, canvasContext: ctx, viewport });
        await task.promise;
        if (!cancelled) setDrawn(true);
      } catch (err) {
        if ((err as { name?: string })?.name !== "RenderingCancelledException") {
          console.error(`PdfPreview: failed to render page ${pageNumber}`, err);
        }
      }
    })();

    return () => {
      cancelled = true;
      task?.cancel();
      pdfPage?.cleanup();
    };
  }, [near, pdf, pageNumber, rotation, width]);

  return (
    <div
      ref={wrapRef}
      data-page={pageNumber}
      className="relative shrink-0 rounded-sm bg-white shadow-lg"
      style={{ width, height: Math.round(width * (aspect ?? defaultAspect)) }}
    >
      {!drawn && (
        <span className="font-sans-ui absolute inset-0 flex items-center justify-center text-xs tabular-nums text-[var(--ink)]/25">
          {pageNumber}
        </span>
      )}
      <canvas ref={canvasRef} aria-label={`${title} — page ${pageNumber}`} className="absolute top-0 left-0" />
    </div>
  );
}

// A brand-styled PDF viewer rendered entirely client-side (pdfjs-dist):
// every page stacked in one continuous vertical scroll, like a PDF reader,
// with our own toolbar — rotate, zoom, jump to page, download. Zooming past
// fit-to-width scrolls sideways.
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
  const contentRef = useRef<HTMLDivElement>(null);
  const loadingTaskRef = useRef<{ destroy: () => Promise<void> } | null>(null);
  const anchorRef = useRef<{ y: number; x: number } | null>(null);
  const scrollFrameRef = useRef(0);

  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [firstSize, setFirstSize] = useState<{ w: number; h: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
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
    setPdf(null);
    setFirstSize(null);

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
        const doc = await loadingTask.promise;
        const first = await doc.getPage(1);
        const v = first.getViewport({ scale: 1 });
        if (cancelled) return;
        setPdf(doc);
        setFirstSize({ w: v.width, h: v.height });
        setNumPages(doc.numPages);
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

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [isLoading]);

  const rotated = rotation % 180 !== 0;
  const baseW = firstSize ? (rotated ? firstSize.h : firstSize.w) : 1;
  const baseH = firstSize ? (rotated ? firstSize.w : firstSize.h) : 1;
  const available = Math.max(containerWidth - (containerWidth < 640 ? 24 : 48), 100);
  const pageWidth = Math.round(baseW * Math.min(available / baseW, 2) * zoom);
  const defaultAspect = baseH / baseW;

  // Keep the reader's place when zoom/rotation change the page sizes.
  useLayoutEffect(() => {
    const el = viewportRef.current;
    const anchor = anchorRef.current;
    if (!el || !anchor) return;
    anchorRef.current = null;
    el.scrollTop = anchor.y * el.scrollHeight;
    el.scrollLeft = anchor.x * el.scrollWidth - el.clientWidth / 2;
  }, [zoom, rotation]);

  function rememberPlace() {
    const el = viewportRef.current;
    if (!el || !el.scrollHeight || !el.scrollWidth) return;
    anchorRef.current = {
      y: el.scrollTop / el.scrollHeight,
      x: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth,
    };
  }

  function updateCurrentPage() {
    scrollFrameRef.current = 0;
    const root = viewportRef.current;
    const content = contentRef.current;
    if (!root || !content) return;
    const mid = root.scrollTop + root.clientHeight / 2;
    let current = 1;
    for (const child of Array.from(content.children) as HTMLElement[]) {
      if (child.offsetTop <= mid) current = Number(child.dataset.page) || current;
      else break;
    }
    setPage(current);
  }

  function onScroll() {
    if (!scrollFrameRef.current) scrollFrameRef.current = requestAnimationFrame(updateCurrentPage);
  }

  useEffect(() => () => cancelAnimationFrame(scrollFrameRef.current), []);

  function goTo(n: number) {
    const target = Math.min(numPages, Math.max(1, n));
    const root = viewportRef.current;
    const el = contentRef.current?.querySelector<HTMLElement>(`[data-page="${target}"]`);
    if (!root || !el) return;
    root.scrollTop = el.offsetTop - PAGE_GAP;
    setPage(target);
  }
  function zoomOut() {
    rememberPlace();
    setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));
  }
  function zoomIn() {
    rememberPlace();
    setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  }
  function rotate() {
    rememberPlace();
    setRotation((r) => (r + 90) % 360);
  }
  function downloadPdf() {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (zoom > 1) return;
    if (e.key === "ArrowLeft") goTo(page - 1);
    if (e.key === "ArrowRight") goTo(page + 1);
  }

  return (
    <div className="flex h-full min-w-0 flex-col outline-none" tabIndex={0} onKeyDown={onKeyDown}>
      <div
        ref={viewportRef}
        onScroll={onScroll}
        className="relative min-w-0 flex-1 overflow-auto"
      >
        {isLoading && (
          <div className="font-sans-ui flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-xs text-[var(--ink)]/50">
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
        {error && (
          <div className="font-sans-ui mx-auto flex h-full max-w-[260px] flex-col items-center justify-center gap-4 p-6 text-center text-xs text-[var(--ink)]/60">
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
        {!isLoading && !error && pdf && firstSize && (
          <div
            ref={contentRef}
            className="relative mx-auto flex w-max min-w-full flex-col items-center p-3 sm:p-6"
            style={{ gap: PAGE_GAP }}
          >
            {Array.from({ length: numPages }, (_, i) => (
              <PdfPage
                key={`${i + 1}-${rotation}`}
                pdf={pdf}
                pageNumber={i + 1}
                rotation={rotation}
                width={pageWidth}
                defaultAspect={defaultAspect}
                rootRef={viewportRef}
                title={title}
              />
            ))}
          </div>
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
                onClick={() => goTo(page - 1)}
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
                onClick={() => goTo(page + 1)}
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
