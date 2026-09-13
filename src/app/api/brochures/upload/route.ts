import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { r2PresignPut, publicUrlFor } from "@/lib/r2";

// Real brochure PDFs run several MB — well past Vercel's fixed 4.5MB
// request-body limit for Functions, which no config can raise. This route
// only hands out a short-lived presigned PUT url; the browser then puts
// the file straight to R2 (see src/lib/r2Client.ts), never through this
// function.
const PDF_RE = /^brochures\/[a-zA-Z0-9_-]+--.+\.pdf$/;
const THUMB_RE = /^brochure-thumbs\/[a-zA-Z0-9_-]+\.png$/;

export async function POST(request: Request): Promise<NextResponse> {
  // Defense in depth — proxy.ts already gates every non-public route
  // behind the admin cookie, but verify again here since this route hands
  // out a write credential.
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("srs_admin_session")?.value;
  if (!adminSession || adminSession !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { pathname, contentType } = (await request.json()) as { pathname?: string; contentType?: string };
  if (!pathname || !contentType) {
    return NextResponse.json({ error: "Missing pathname or contentType." }, { status: 400 });
  }

  const isThumb = THUMB_RE.test(pathname);
  if (!PDF_RE.test(pathname) && !isThumb) {
    return NextResponse.json({ error: "Invalid brochure path." }, { status: 400 });
  }
  if ((isThumb && contentType !== "image/png") || (!isThumb && contentType !== "application/pdf")) {
    return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
  }

  try {
    const uploadUrl = await r2PresignPut(pathname, contentType);
    return NextResponse.json({ uploadUrl, publicUrl: publicUrlFor(pathname) });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
