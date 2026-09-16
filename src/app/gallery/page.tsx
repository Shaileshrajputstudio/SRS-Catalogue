import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getBrochures } from "@/lib/brochures";
import { getCatalogueTypes } from "@/lib/catalogueTypesStore";
import { studio } from "@/lib/studio";
import { FloatingContact } from "@/components/FloatingContact";
import { GalleryBrowser } from "@/components/GalleryBrowser";

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

export default async function GalleryPage() {
  const [brochures, catalogueTypes] = await Promise.all([getBrochures(), getCatalogueTypes()]);

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
        <h1 className="mb-3 text-3xl leading-tight sm:text-4xl">Every catalogue, in one place.</h1>
        <p className="max-w-xl text-[var(--ink)]/70">
          Browse the full SRS collection. Tap any catalogue to view or download it.
        </p>
      </section>

      <section className="mb-16 flex-1">
        <GalleryBrowser brochures={brochures} catalogueTypes={catalogueTypes} />
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
