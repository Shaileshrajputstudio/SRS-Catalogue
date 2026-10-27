import Image from "next/image";
import Link from "next/link";
import { studio } from "@/lib/studio";
import { ArrowOutwardIcon } from "@/components/ArrowIcons";

// There is deliberately no gallery at the bare /gallery: it would have to
// pick a hub (India or Rest of World) for the visitor, and so could show
// someone the wrong region's prices — or reveal that another region exists —
// when they trim a shared link. Each hub lives only at /gallery/<region>.
// This page shows no catalogue data at all, just a branded pointer to the
// website.
export default function GalleryIndexPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 text-center">
      <Image
        src="/brand/srs-logo.png"
        alt={studio.name}
        width={1488}
        height={366}
        unoptimized
        priority
        className="mb-10 h-9 w-auto"
      />
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--paper-2)]/70">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-[var(--ink)]/45" aria-hidden="true">
          <rect x="4" y="8" width="13" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7.5 5h11a1.5 1.5 0 0 1 1.5 1.5V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M7.5 13h7M7.5 16.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <h1 className="mb-3 text-2xl leading-tight">Looking for our catalogues?</h1>
      <p className="font-sans-ui mb-8 text-sm text-[var(--ink)]/60">
        Please open the catalogue link we shared with you. Meanwhile, explore our work on our website.
      </p>
      <Link
        href={studio.website}
        target="_blank"
        className="font-sans-ui inline-flex items-center gap-1.5 rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)] hover:text-[var(--ink)]"
      >
        Explore our website
        <ArrowOutwardIcon className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
