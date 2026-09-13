import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBrochures, shareTag } from "@/lib/brochures";
import { buildWebsiteLinkHref } from "@/lib/websiteLink";
import { studio } from "@/lib/studio";
import { FloatingContact } from "@/components/FloatingContact";
import { PdfIcon } from "@/components/PdfIcon";
import { ArrowOutwardIcon } from "@/components/ArrowIcons";

// Always fresh — a brochure can be replaced or removed from the admin
// panel at any time, and this page shouldn't serve a stale cached link.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const all = await getBrochures();
  const brochure = all.find((b) => b.id === id);
  if (!brochure) return {};

  const description = `A closer look at the ${brochure.title} collection, from ${studio.name}.`;

  return {
    title: brochure.title,
    description,
    openGraph: {
      title: brochure.title,
      description,
      type: "website",
      images: brochure.thumbnailUrl ? [{ url: brochure.thumbnailUrl }] : undefined,
    },
    twitter: {
      card: brochure.thumbnailUrl ? "summary_large_image" : "summary",
      title: brochure.title,
      description,
      images: brochure.thumbnailUrl ? [brochure.thumbnailUrl] : undefined,
    },
  };
}

export default async function BrochurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const all = await getBrochures();
  const brochure = all.find((b) => b.id === id);
  if (!brochure) notFound();

  // Same Catalogue Type only — a Product catalogue shouldn't cross-sell a
  // Story or General one just because both happen to be untagged.
  const others = all
    .filter((b) => b.id !== id && b.catalogueType === brochure.catalogueType && shareTag(brochure.tags, b.tags))
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-4xl px-6 py-6 sm:py-8">
      <Image
        src="/brand/srs-logo.png"
        alt={studio.name}
        width={1488}
        height={366}
        priority
        unoptimized
        className="mb-6 h-9 w-auto sm:h-10"
      />

      <section className="mb-16">
        <h1 className="mb-3 text-3xl leading-tight sm:text-4xl">{brochure.title}</h1>
        <p className="mb-6 max-w-xl text-[var(--ink)]/70">
          A closer look at the {brochure.title} collection.
        </p>

        {brochure.thumbnailUrl && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            <Image
              src={brochure.thumbnailUrl}
              alt={brochure.title}
              width={1200}
              height={849}
              unoptimized
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <a
            href={brochure.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans-ui inline-flex items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)] hover:text-[var(--ink)]"
          >
            View / Download Catalogue (PDF)
          </a>
          {brochure.websiteLink && (
            <a
              href={buildWebsiteLinkHref(studio.website, brochure.websiteLink)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans-ui inline-flex items-center gap-1 text-sm font-medium text-[var(--ink)]/70 underline-offset-2 hover:text-[var(--ink)] hover:underline"
            >
              See more on website
              <ArrowOutwardIcon className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </section>

      {others.length > 0 && (
        <section>
          <h2 className="font-sans-ui mb-6 text-lg">Explore More From Our Collection</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((other) => (
              <Link key={other.id} href={`/brochure/${other.id}`} className="group block">
                <div className="mb-2 flex aspect-[297/210] items-center justify-center overflow-hidden rounded-xl border border-[var(--line)] bg-white">
                  {other.thumbnailUrl ? (
                    <Image
                      src={other.thumbnailUrl}
                      alt={other.title}
                      width={800}
                      height={566}
                      unoptimized
                      className="h-full w-full object-cover transition group-hover:opacity-80"
                    />
                  ) : (
                    <PdfIcon className="h-10 w-10 text-[var(--line)]" />
                  )}
                </div>
                <p className="font-sans-ui truncate text-sm font-semibold text-[var(--ink)]">{other.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <FloatingContact />
    </div>
  );
}
