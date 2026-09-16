"use client";

import { ArrowBackIcon } from "@/components/ArrowIcons";
import { useQrCodeSvg, downloadQrSvg } from "@/lib/useQrCodeSvg";

// A full-screen takeover of the Share sheet, not just a bigger inline
// box — this is what gets held up to someone or pointed at a group at an
// event, so it needs to read from a few feet away, not just up close.
export function QrCodeOverlay({
  url,
  title,
  onClose,
  fixed = false,
}: {
  url: string;
  title: string;
  onClose: () => void;
  // ShareModal nests this inside its own already-positioned sheet
  // (absolute, bounded to the modal's rounded corners); a page-level
  // caller with no such wrapper needs it to cover the real viewport
  // instead.
  fixed?: boolean;
}) {
  const svg = useQrCodeSvg(url, 480);

  return (
    <div
      className={`${fixed ? "fixed" : "absolute"} inset-0 z-50 flex flex-col items-center justify-center gap-10 overflow-y-auto bg-[var(--paper)] px-6 py-14 text-center`}
    >
      <button
        onClick={onClose}
        className="font-sans-ui absolute top-6 left-6 flex items-center gap-1.5 text-xs font-medium text-[var(--ink)]/60 transition hover:text-[var(--ink)]"
      >
        <ArrowBackIcon className="h-4 w-4" />
        Back
      </button>

      <div>
        <p className="font-sans-ui mb-2 text-xs tracking-[0.2em] text-[var(--ash)] uppercase">
          Scan to view
        </p>
        <h2 className="max-w-xs truncate text-xl text-[var(--ink)]">{title}</h2>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8">
        {svg ? (
          <div
            className="h-52 w-52 sm:h-60 sm:w-60 [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="h-52 w-52 animate-pulse rounded bg-[var(--ink)]/10 sm:h-60 sm:w-60" />
        )}
      </div>

      <div>
        <p className="font-sans-ui max-w-[220px] text-xs leading-relaxed text-[var(--ink)]/50">
          No number or email needed — point a phone camera at this.
        </p>
        <button
          onClick={() => svg && downloadQrSvg(svg, title)}
          disabled={!svg}
          className="font-sans-ui mt-5 text-xs font-medium text-[var(--ink)] underline underline-offset-2 hover:text-[var(--accent)] disabled:opacity-40"
        >
          Download for printing
        </button>
      </div>
    </div>
  );
}
