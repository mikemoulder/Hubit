import type { Product } from "./catalog.ts";
import type { Query, Sort } from "./search.ts";
import { DEPARTMENTS } from "./sources.ts";
import type { Department } from "./types.ts";

// What leaves the server about a product. Offers (stores, their prices, their URLs)
// are the backend's business; shoppers and agents get Hubit's product.

export type ProductSummary = {
  id: string;
  title: string;
  brand: string;
  department: Department;
  image: string | null;
  priceCents: number;
  compareAtCents: number | null;
  available: boolean;
  rating: number | null;
  reviewCount: number;
  /** How many stores can fulfil it. More than one means Hubit can route around stock-outs. */
  sourceCount: number;
};

export type ProductDetail = ProductSummary & {
  description: string;
  images: string[];
  styleCode: string | null;
  options: { option: string; available: boolean; priceCents: number }[];
  reviews: Product["reviews"];
  /** When the source data behind this product was last read. */
  syncedAt: string;
};

export function summary(p: Product): ProductSummary {
  return {
    id: p.id,
    title: p.title,
    brand: p.brand,
    department: p.department,
    image: p.images[0] ?? null,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    available: p.available,
    rating: p.rating,
    reviewCount: p.reviewCount,
    sourceCount: p.offers.length,
  };
}

/** Some stores keep only an initial ("T", "kb"); on its own it reads as a missing name. */
export function reviewerName(author: string): string {
  const a = author.trim();
  return a.length >= 3 ? a : a ? `Verified buyer ${a}.` : "Verified buyer";
}

export function detail(p: Product): ProductDetail {
  return {
    ...summary(p),
    description: p.description,
    images: p.images,
    styleCode: p.styleCode,
    options: p.options,
    reviews: p.reviews.map((r) => ({ ...r, author: reviewerName(r.author) })),
    syncedAt: p.offers.map((o) => o.fetchedAt).sort()[0],
  };
}

const SORTS: Sort[] = ["featured", "price-asc", "price-desc", "rating"];
const DEPT_IDS = new Set<string>(DEPARTMENTS.map((d) => d.id));

/** URL search params -> a search query. Unknown values are dropped, never trusted. */
export function parseQuery(params: Record<string, string | string[] | undefined>): Query {
  const one = (k: string) => {
    const v = params[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const cents = (k: string) => {
    const v = Number(one(k));
    return Number.isFinite(v) && v >= 0 ? Math.round(v * 100) : undefined;
  };
  const dept = one("dept");
  const sort = one("sort") as Sort | undefined;
  return {
    q: one("q")?.slice(0, 100),
    department: dept && DEPT_IDS.has(dept) ? (dept as Department) : undefined,
    brand: one("brand"),
    minCents: cents("min"),
    maxCents: cents("max"),
    inStock: one("stock") === "1",
    sort: sort && SORTS.includes(sort) ? sort : undefined,
    page: Math.max(1, Number(one("page")) || 1),
  };
}
