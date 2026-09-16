"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Brochure, CatalogueType } from "@/lib/brochures";
import type { CatalogueTypeDef } from "@/lib/catalogueTypes";
import { PdfIcon } from "@/components/PdfIcon";

// The public counterpart to BrochureManager's admin library view — same
// tab-by-catalogue-type browsing, but read-only: no upload, no dots
// menu, no tag editing. This is what the platform-wide QR code lands on.
export function GalleryBrowser({
  brochures,
  catalogueTypes,
}: {
  brochures: Brochure[];
  catalogueTypes: CatalogueTypeDef[];
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
    return <p className="font-sans-ui text-sm text-[var(--ink)]/50">Nothing published yet — check back soon.</p>;
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
          <Link key={brochure.id} href={`/brochure/${brochure.id}?from=gallery`} className="group block">
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
