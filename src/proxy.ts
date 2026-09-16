import { NextRequest, NextResponse } from "next/server";

// Always reachable, regardless of session — the admin login page, the
// forgot/reset-password flow (has to work while logged out — that's the
// whole point), and static assets.
const PUBLIC_PREFIXES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/brand/",
  "/fonts/",
  "/favicon",
  "/icon.png",
  "/icons/",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
  "/pdf.worker.min.mjs",
];

// Client-facing routes (a brochure link a client actually opens, or the
// full gallery a platform-wide QR code lands on) are intentionally open
// — no PIN. Only the admin dashboard (root "/") and the brochure-upload
// API stay behind ADMIN_PASSWORD.
const CLIENT_PREFIXES = ["/brochure/", "/gallery"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (CLIENT_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const adminSession = request.cookies.get("srs_admin_session")?.value;
  const isAdmin = !!adminSession && adminSession === process.env.ADMIN_PASSWORD;

  if (isAdmin) return NextResponse.next();

  // Everything else — including the root "/" — is admin-only.
  const adminLoginUrl = new URL("/login", request.url);
  adminLoginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(adminLoginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
