"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Explicit `width` matters here, not just cosmetics — without it the
// library omits width/height attributes on the root <svg> (viewBox
// only), which different browsers size inconsistently when injected via
// dangerouslySetInnerHTML. Always pair this with a wrapper that forces
// the svg to fill it (e.g. `[&>svg]:h-full [&>svg]:w-full`), since the
// rendered size here is just what gets embedded in the markup, not the
// on-screen size.
export function useQrCodeSvg(url: string, width = 200): string | null {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSvg(null);
    QRCode.toString(url, {
      type: "svg",
      margin: 1,
      width,
      color: { dark: "#1e1e1e", light: "#00000000" },
    }).then((result) => {
      if (!cancelled) setSvg(result);
    });
    return () => {
      cancelled = true;
    };
  }, [url, width]);

  return svg;
}

export function downloadQrSvg(svg: string, title: string) {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-qr.svg`;
  a.click();
  URL.revokeObjectURL(blobUrl);
}
