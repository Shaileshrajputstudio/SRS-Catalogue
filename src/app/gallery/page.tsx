import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { studio } from "@/lib/studio";
import { FloatingContact } from "@/components/FloatingContact";
import { REGIONS } from "@/lib/regions";

// Always fresh — a brochure can be added or removed from the admin panel
// at any time, and this is the one page most likely to be open on a
// shared screen at an event for a whole day.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue Gallery",
  description: `Browse every catalogue from ${studio.name} in one place.`,
  openGraph: {
    title: `Catalogue Gallery — ${studio.name}`,
    description: `Browse every catalogue from ${studio.name} in one place.`,
    type: "website",
  },
};

// The platform now has one hub per region (India / Rest of World), each
// with its own link and QR code. Anyone arriving on the bare /gallery —
// including from a QR code printed before regions existed — picks theirs.
export default function GalleryChooserPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-6 sm:py-8">
      <Link href="/gallery" className="mb-6 inline-block w-fit">
        <Image
          src="/brand/srs-logo.png"
          alt={studio.name}
          width={1488}
          height={366}
          priority
          unoptimized
          className="h-9 w-auto sm:h-10"
        />
      </Link>

      <section className="mb-10">
        <h1 className="mb-3 text-3xl leading-tight sm:text-4xl">Choose your region.</h1>
        <p className="max-w-xl text-[var(--ink)]/70">
          Catalogues are priced for your market. Pick where you are to see the right one.
        </p>
      </section>

      <section className="mb-16 flex-1">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {REGIONS.map((r) => (
            <Link
              key={r.key}
              href={`/gallery/${r.key}`}
              className="group rounded-2xl border border-[var(--line)] bg-[#F6F3E8] p-8 transition hover:border-[var(--ink)]"
            >
              <p className="font-sans-ui mb-2 text-xs tracking-[0.2em] text-[var(--ash)] uppercase">
                Prices in {r.currency}
              </p>
              <p className="text-2xl text-[var(--ink)]">{r.label}</p>
              <p className="font-sans-ui mt-4 text-sm text-[var(--ink)]/60 group-hover:text-[var(--ink)]">
                View catalogues →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="font-sans-ui mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-6 text-xs text-[var(--ink)]/40">
        <p className="flex items-center gap-2.5">
          <span>
            © {new Date().getFullYear()} {studio.name}
          </span>
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
          <a
            href={studio.website}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--ink)]/70"
          >
            Visit Website
          </a>
        </p>
        <a href="https://hueness.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--ink)]/70">
          Made by Hueness
        </a>
      </div>

      <FloatingContact />
    </div>
  );
}
