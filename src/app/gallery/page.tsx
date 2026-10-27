import { redirect } from "next/navigation";
import { DEFAULT_REGION } from "@/lib/regions";

// There is deliberately no "choose your region" page: it would show a
// visitor of one hub the existence of the other (e.g. someone trimming
// "/row" off a shared link). The bare /gallery — which is also what any
// platform QR code printed before regions existed points at — just opens
// the original (India) hub. Each hub's own link is /gallery/<region>.
export default function GalleryIndexPage() {
  redirect(`/gallery/${DEFAULT_REGION}`);
}
