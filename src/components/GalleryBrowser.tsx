"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Brochure, CatalogueType } from "@/lib/brochures";
import type { CatalogueTypeDef } from "@/lib/catalogueTypes";
import { regionDef, type Region } from "@/lib/regions";
import { PdfIcon } from "@/components/PdfIcon";

// The public counterpart to BrochureManager's admin library view — same
// tab-by-catalogue-type browsing, but read-only: no upload, no dots
// menu, no tag editing. This is what the platform-wide QR code lands on.
export function GalleryBrowser({
  brochures,
  catalogueTypes,
  region,
}: {
  brochures: Brochure[];
  catalogueTypes: CatalogueTypeDef[];
  region: Region;
}) {
  const nonEmptyTypes = useMemo(
    () => catalogueTypes.filter((t) => brochures.some((b) => b.catalogueType === t.key)),
    [brochures, catalogueTypes],
  );
  const [activeTab, setActiveTab] = useState<CatalogueType>(nonEmptyTypes[0]?.key ?? "general");

  const visible = useMemo(
    () => brochures.filter((b) => b.catalogueType === activeTab),
    [brochures, activeTab],
  );

  if (brochures.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--line)] px-6 py-20 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--paper-2)]/70">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-[var(--ink)]/45" aria-hidden="true">
            <rect x="4" y="8" width="13" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7.5 5h11a1.5 1.5 0 0 1 1.5 1.5V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M7.5 13h7M7.5 16.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="mb-2 text-xl text-[var(--ink)]">Catalogues coming soon</p>
        <p className="font-sans-ui max-w-xs text-sm text-[var(--ink)]/50">
          We&apos;re preparing the {regionDef(region).label} catalogues. Please check back shortly.
        </p>
      </div>
    );
  }

  return (
    <div>
      {nonEmptyTypes.length > 1 && (
        <div className="font-sans-ui no-scrollbar mb-8 flex items-center gap-1 overflow-x-auto border-y border-[var(--line)] py-1">
          {nonEmptyTypes.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm whitespace-nowrap transition ${
                activeTab === key
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--ink)]/60 hover:text-[var(--ink)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
        {visible.map((brochure) => (
          <Link key={brochure.id} href={`/brochure/${brochure.id}?from=gallery-${region}`} className="group block">
            <div className="mb-2 flex aspect-[297/210] items-center justify-center overflow-hidden rounded-xl border border-[var(--line)] bg-white">
              {brochure.thumbnailUrl ? (
                <Image
                  src={brochure.thumbnailUrl}
                  alt={brochure.title}
                  width={800}
                  height={566}
                  unoptimized
                  className="h-full w-full object-cover transition group-hover:opacity-80"
                />
              ) : (
                <PdfIcon className="h-10 w-10 text-[var(--line)]" />
              )}
            </div>
            <p className="font-sans-ui truncate text-sm text-[var(--ink)] sm:text-base">{brochure.title}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
