// The two catalogue hubs. Every brochure belongs to exactly one — India
// catalogues carry rupee prices, Rest of World ones carry USD prices — and
// each hub has its own public gallery (and so its own platform QR code).
// Client-safe on purpose (no server imports): the admin UI, the public
// pages and the server actions all share this one list.
export type Region = "india" | "row";

export type RegionDef = {
  key: Region;
  label: string; // "India"
  currency: string; // "INR (₹)"
};

export const REGIONS: RegionDef[] = [
  { key: "india", label: "India", currency: "INR (₹)" },
  { key: "row", label: "Rest of World", currency: "USD ($)" },
];

// Brochures uploaded before regions existed were all the India catalogue.
export const DEFAULT_REGION: Region = "india";

export function isRegion(value: string): value is Region {
  return value === "india" || value === "row";
}

export function regionDef(key: Region): RegionDef {
  return REGIONS.find((r) => r.key === key) ?? REGIONS[0];
}

// Where each hub's public gallery (and so its platform QR code) lives.
// India keeps the original /gallery path — QR codes printed before regions
// existed point there and must keep working. Rest of World deliberately
// sits OUTSIDE /gallery (at /world): if it were /gallery/row, a visitor who
// trimmed "/row" off the link would land on the India hub and its prices.
export function hubPath(region: Region): string {
  return region === "row" ? "/world" : "/gallery";
}
