import type { MetadataRoute } from "next";

// Lets the Studio "Add to Home Screen" on their phone — from then on it
// opens full-screen, no browser address bar, icon and all, the way any
// other app on their phone does. This is the admin tool only; the
// public /brochure/[id] pages a client opens stay plain web pages.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SRS Catalogue Hub",
    short_name: "Catalogue Hub",
    description: "Upload and share Shailesh Rajput Studio's catalogues.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F1E6",
    theme_color: "#1E1E1E",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
