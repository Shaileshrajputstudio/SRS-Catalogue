import { HubGalleryPage, hubMetadata } from "@/components/HubGalleryPage";

// India's hub keeps the original /gallery address, so every platform QR code
// already printed keeps working. (Rest of World lives at /world.)
export const dynamic = "force-dynamic";
export const metadata = hubMetadata("india");

export default function GalleryPage() {
  return <HubGalleryPage region="india" />;
}
