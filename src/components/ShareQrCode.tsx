"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Renders as an SVG string (not <canvas>/<img>) so it stays crisp at any
// size — scanned off a phone up close, or projected/enlarged at an event
// booth — and downloads as a real vector file, not a fixed-resolution
// raster. Brand ink/paper colors baked in rather than left black-on-white.
export function ShareQrCode({ url, title }: { url: string; title: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSvg(null);
    QRCode.toString(url, {
      type: "svg",
      margin: 1,
      color: { dark: "#1e1e1e", light: "#00000000" },
    }).then((result) => {
      if (!cancelled) setSvg(result);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  function downloadSvg() {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-qr.svg`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-[var(--line)] bg-[#F6F3E8] p-4">
      {svg ? (
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center">
          <span className="h-16 w-16 animate-pulse rounded bg-[var(--ink)]/10" />
        </div>
      )}
      <div className="min-w-0">
        <p className="font-sans-ui mb-1 text-xs font-medium text-[var(--ink)]">Scan to view</p>
        <p className="font-sans-ui mb-2 text-[11px] leading-relaxed text-[var(--ink)]/60">
          No number or email needed — point a phone camera at this.
        </p>
        <button
          onClick={downloadSvg}
          disabled={!svg}
          className="font-sans-ui text-xs font-medium text-[var(--ink)] underline underline-offset-2 hover:text-[var(--accent)] disabled:opacity-40"
        >
          Download for printing
        </button>
      </div>
    </div>
  );
}
