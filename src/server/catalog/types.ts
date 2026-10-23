// The normalised catalogue. Every source adapter maps its own payload onto these
// shapes, so nothing downstream (matching, pricing, the UI, the agent tools) ever
// sees a Shopify or WooCommerce field.

export type Platform = "shopify" | "woocommerce" | "ebay";

export type Department =
  | "footwear"
  | "apparel"
  | "beauty"
  | "home"
  | "kitchen"
  | "accessories"
  | "audio-tech"
  | "outdoor"
  | "desk"
  | "food-drink";

export type Source = {
  /** Stable slug, e.g. "allbirds". */
  id: string;
  name: string;
  platform: Platform;
  /** Host the adapter reads from, e.g. "allbirds.com". */
  domain: string;
  /** The department products fall into when nothing more specific matches. */
  department: Department;
  /** Ships from, shown as seller information. */
  country: string;
};

export type Review = {
  author: string;
  rating: number;
  body: string;
  date: string;
};

export type SourceVariant = {
  externalId: string;
  title: string;
  sku: string | null;
  /** In the source's own currency, minor units. */
  priceMinor: number;
  compareAtMinor: number | null;
  available: boolean;
};

/** One listing as a source sells it, before Hubit prices it. */
export type SourceListing = {
  sourceId: string;
  externalId: string;
  url: string;
  title: string;
  brand: string;
  department: Department;
  /** The source's own category label, kept for search and display. */
  sourceType: string;
  description: string;
  images: string[];
  currency: string;
  variants: SourceVariant[];
  rating: number | null;
  reviewCount: number;
  reviews: Review[];
  tags: string[];
  fetchedAt: string;
};

export type FxRates = {
  base: "USD";
  date: string;
  /** Units of currency per 1 USD. */
  rates: Record<string, number>;
};

export type Snapshot = {
  takenAt: string;
  fx: FxRates;
  sources: Source[];
  listings: SourceListing[];
  /** Sources that failed during this snapshot, with the reason. */
  errors: { sourceId: string; error: string }[];
};
