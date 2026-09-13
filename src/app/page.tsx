import Image from "next/image";
import { studio } from "@/lib/studio";
import { getBrochures } from "@/lib/brochures";
import { getWebsiteLinkOptions } from "@/lib/websiteCategories";
import { BrochureManager } from "@/components/BrochureManager";
import { LogoutButton } from "@/components/LogoutButton";
import { ChangePasswordButton } from "@/components/ChangePasswordButton";

// Always fresh — the admin dashboard needs to show the current brochure
// state immediately after an upload, not a stale cached snapshot.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [brochures, websiteLinkOptions] = await Promise.all([getBrochures(), getWebsiteLinkOptions()]);

  return (
    <>
      <div className="font-sans-ui sticky top-0 z-40 flex items-center justify-between bg-[var(--ink)] px-6 py-2 text-sm text-white">
        <span className="flex items-center gap-2 tracking-[0.15em] uppercase">
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
          <span className="sm:hidden">SRS Hub</span>
          <span className="hidden sm:inline">SRS Catalogue Hub</span>
        </span>
        <div className="flex items-center gap-5">
          <ChangePasswordButton />
          <LogoutButton />
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-6 py-8 sm:px-14 sm:py-10">
        <Image
          src="/brand/srs-logo.png"
          alt={studio.name}
          width={1488}
          height={366}
          priority
          unoptimized
          className="mb-4 h-7 w-auto sm:h-8"
        />

        <BrochureManager initialBrochures={brochures} websiteLinkOptions={websiteLinkOptions} />

        <div className="font-sans-ui mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-6 text-xs text-[var(--ink)]/40">
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
          <p>Made by Hueness</p>
        </div>
      </div>
    </>
  );
}
