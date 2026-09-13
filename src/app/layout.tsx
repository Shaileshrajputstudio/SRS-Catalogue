import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Duru_Sans } from "next/font/google";
import "./globals.css";

const annapurna = localFont({
  src: [
    { path: "../../public/fonts/AnnapurnaSIL-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/AnnapurnaSIL-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/AnnapurnaSIL-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-annapurna",
  display: "swap",
});

const duruSans = Duru_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-duru",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SRS Catalogue Hub",
    template: "%s — Shailesh Rajput Studio",
  },
  description: "Product catalogues from Shailesh Rajput Studio.",
  // Brochure links are shared privately (WhatsApp, email) with specific
  // clients — not meant to turn up in search results.
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  icons: { apple: "/apple-touch-icon.png" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Catalogue Hub",
  },
};

export const viewport: Viewport = {
  themeColor: "#1E1E1E",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${annapurna.variable} ${duruSans.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
