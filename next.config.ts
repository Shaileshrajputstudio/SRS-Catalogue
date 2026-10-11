import type { NextConfig } from "next";

// Visitors' browsers never talk to r2.dev directly when FILES_BASE_URL is
// set (see publicUrlFor in lib/r2.ts): files are served from this app's own
// /files/* path, which Vercel proxies to the bucket's public URL. Some
// networks (certain Indian ISPs) intercept or block *.r2.dev and show a
// certificate error, which is a dead end for a client opening a catalogue.
const R2_ORIGIN = (process.env.R2_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!R2_ORIGIN) return [];
    return [{ source: "/files/:path*", destination: `${R2_ORIGIN}/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/files/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=300, s-maxage=3600" },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      // Real brochure PDFs (cover + product pages + back page, real
      // photography) run several MB — well past Next's 1MB Server Action
      // default. uploadCategoryBrochure sends the file straight through
      // one, so this needs real headroom.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
