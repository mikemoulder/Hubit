import { DEPARTMENTS } from "./sources.ts";
import type { Catalog, Product } from "./catalog.ts";
import type { Department } from "./types.ts";

export type Sort = "featured" | "price-asc" | "price-desc" | "rating";

export type Query = {
  q?: string;
  department?: Department;
  brand?: string;
  minCents?: number;
  maxCents?: number;
  inStock?: boolean;
  sort?: Sort;
  page?: number;
  pageSize?: number;
};

export type Facet = { value: string; label: string; count: number };

export type SearchResult = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  facets: { departments: Facet[]; brands: Facet[] };
};

const DEPT_LABEL = new Map(DEPARTMENTS.map((d) => [d.id, d.label]));

const fold = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
const tokens = (s: string) => fold(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

type Indexed = { title: string; brand: string; rest: string };
const index = new WeakMap<Product, Indexed>();

function indexed(p: Product): Indexed {
  let i = index.get(p);
  if (!i) {
    i = {
      title: ` ${tokens(p.title).join(" ")} `,
      brand: ` ${tokens(p.brand).join(" ")} `,
      // Not the description: stores mention mugs in coffee copy and jackets in
      // suncatcher copy, and a word in passing is not what a shopper searched for.
      rest: ` ${tokens([DEPT_LABEL.get(p.department) ?? "", p.styleCode ?? "", ...p.tags].join(" ")).join(" ")} `,
    };
    index.set(p, i);
  }
  return i;
}

/** Every query word must appear in the title, brand, tags, department or style code; title hits rank first. */
function score(p: Product, words: string[]): number {
  const i = indexed(p);
  let total = 0;
  for (const w of words) {
    const word = ` ${w}`;
    if (i.title.includes(word)) total += 3;
    else if (i.brand.includes(word)) total += 2;
    else if (i.rest.includes(word)) total += 1;
    else return 0;
  }
  return total;
}

function featuredRank(p: Product): number {
  // Products more than one store can fulfil, in stock and rated, lead.
  return (p.offers.length > 1 ? 4 : 0) + (p.available ? 2 : 0) + (p.rating ? 1 : 0);
}

function facet<T extends string>(items: Product[], key: (p: Product) => T, label: (v: T) => string): Facet[] {
  const counts = new Map<T, number>();
  for (const p of items) counts.set(key(p), (counts.get(key(p)) ?? 0) + 1);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: label(value), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function search(catalog: Catalog, query: Query): SearchResult {
  const words = tokens(query.q ?? "");
  const pageSize = Math.min(Math.max(query.pageSize ?? 24, 1), 96);
  const page = Math.max(query.page ?? 1, 1);

  const scored = new Map<Product, number>();
  for (const p of catalog.products) {
    const s = words.length ? score(p, words) : 1;
    if (s > 0) scored.set(p, s);
  }

  const passes = (p: Product, skip?: "department" | "brand") =>
    (skip === "department" || !query.department || p.department === query.department) &&
    (skip === "brand" || !query.brand || p.brand === query.brand) &&
    (query.minCents === undefined || p.priceCents >= query.minCents) &&
    (query.maxCents === undefined || p.priceCents <= query.maxCents) &&
    (!query.inStock || p.available);

  const matched = [...scored.keys()];
  const items = matched.filter((p) => passes(p));
  // Each facet counts as if its own filter were off, so its other values stay choosable.
  const facets = {
    departments: facet(matched.filter((p) => passes(p, "department")), (p) => p.department, (d) => DEPT_LABEL.get(d) ?? d),
    brands: facet(matched.filter((p) => passes(p, "brand")), (p) => p.brand, (b) => b).slice(0, 30),
  };

  const sort = query.sort ?? "featured";
  const order = new Map(catalog.products.map((p, i) => [p, i]));
  items.sort((a, b) => {
    if (sort === "price-asc") return a.priceCents - b.priceCents || order.get(a)! - order.get(b)!;
    if (sort === "price-desc") return b.priceCents - a.priceCents || order.get(a)! - order.get(b)!;
    if (sort === "rating") return (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount || order.get(a)! - order.get(b)!;
    return scored.get(b)! - scored.get(a)! || featuredRank(b) - featuredRank(a) || order.get(a)! - order.get(b)!;
  });

  return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize, facets };
}
