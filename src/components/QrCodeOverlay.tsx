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
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  const svg = useQrCodeSvg(url, 480);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--paper)] px-6 py-10 text-center">
      <button
        onClick={onClose}
        className="font-sans-ui absolute top-5 left-5 flex items-center gap-1.5 text-xs font-medium text-[var(--ink)]/60 transition hover:text-[var(--ink)]"
      >
        <ArrowBackIcon className="h-4 w-4" />
        Back
      </button>

      <p className="font-sans-ui mb-1 text-xs tracking-[0.2em] text-[var(--ash)] uppercase">
        Scan to view
      </p>
      <h2 className="mb-8 max-w-xs truncate text-xl text-[var(--ink)]">{title}</h2>

      {svg ? (
        <div
          className="h-56 w-56 sm:h-64 sm:w-64 [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="h-56 w-56 animate-pulse rounded bg-[var(--ink)]/10 sm:h-64 sm:w-64" />
      )}

      <p className="font-sans-ui mt-8 max-w-[220px] text-xs leading-relaxed text-[var(--ink)]/50">
        No number or email needed — point a phone camera at this.
      </p>
      <button
        onClick={() => svg && downloadQrSvg(svg, title)}
        disabled={!svg}
        className="font-sans-ui mt-4 text-xs font-medium text-[var(--ink)] underline underline-offset-2 hover:text-[var(--accent)] disabled:opacity-40"
      >
        Download for printing
      </button>
    </div>
  );
}
