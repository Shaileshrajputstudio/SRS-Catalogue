import { HubGalleryPage, hubMetadata } from "@/components/HubGalleryPage";

// Rest of World hub (USD prices). Kept outside /gallery on purpose — see
// hubPath in lib/regions.ts.
export const dynamic = "force-dynamic";
export const metadata = hubMetadata("row");

export default function WorldGalleryPage() {
  return <HubGalleryPage region="row" />;
}
