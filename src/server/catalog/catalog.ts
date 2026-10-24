import type { Department, Review, Snapshot, Source, SourceListing } from "./types.ts";

// Turns source listings into Hubit's own catalogue. The shopper sees one product
// with one Hubit price; the offers behind it (which store, at what price, in which
// sizes) stay on the server and decide where each cart line is fulfilled from.

export type OfferVariant = {
  /** Normalised option label, e.g. "9.5" or "Black / M"; "One size" when there is none. */
  option: string;
  priceCents: number;
  available: boolean;
};

export type Offer = {
  sourceId: string;
  listingId: string;
  url: string;
  /** Converted to USD cents at the snapshot's FX rate. */
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  sourcePriceMinor: number;
  available: boolean;
  variants: OfferVariant[];
  fetchedAt: string;
};

export type Product = {
  id: string;
  title: string;
  brand: string;
  department: Department;
  description: string;
  images: string[];
  /** Manufacturer style code shared by every offer, when the product was matched on one. */
  styleCode: string | null;
  /** The best offer's price: the cheapest in stock, else the cheapest. */
  priceCents: number;
  compareAtCents: number | null;
  available: boolean;
  /** Every option any offer sells, in the order the sources list them. */
  options: { option: string; available: boolean; priceCents: number }[];
  rating: number | null;
  reviewCount: number;
  reviews: Review[];
  tags: string[];
  offers: Offer[];
};

export type Catalog = {
  takenAt: string;
  sources: Source[];
  products: Product[];
  byId: Map<string, Product>;
};

// Nike/Jordan "HQ7978-001", adidas "IF1234"-style codes are too loose to trust on
// their own, so only the hyphenated Nike form and Oakley "OO9505" count.
const STYLE_CODE = /\b([A-Z]{1,3}\d{4}-\d{3}|OO\d{4})\b/;

export function styleCodeOf(l: SourceListing): string | null {
  const handle = l.url.slice(l.url.lastIndexOf("/") + 1);
  const text = [l.title, handle, ...l.tags, ...l.variants.slice(0, 3).map((v) => v.sku ?? "")].join(" ").toUpperCase();
  return text.match(STYLE_CODE)?.[1] ?? null;
}

/** "- / 9.5" -> "9.5", "Default Title" -> "One size". */
export function normaliseOption(title: string): string {
  const parts = title.split("/").map((p) => p.trim()).filter((p) => p && p !== "-");
  const joined = parts.join(" / ");
  if (!joined || /^(default( title)?|os|one size|o\/s)$/i.test(joined)) return "One size";
  return joined.replace(/^(\d+(?:\.\d)?)y$/i, "$1Y");
}

const BRAND_ALIASES: Record<string, string> = {
  "air jordan": "Jordan",
  "jordan brand": "Jordan",
  "nike sportswear": "Nike",
};

function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|[\s\-/(&'])(\p{L})/gu, (_, sep, c) => sep + c.toUpperCase());
}

export function normaliseBrand(raw: string): string {
  const b = raw.trim();
  const alias = BRAND_ALIASES[b.toLowerCase()];
  if (alias) return alias;
  return b === b.toUpperCase() && b.length > 3 ? titleCase(b) : b;
}

const isShouting = (s: string) => s === s.toUpperCase() && /[A-Z]{4}/.test(s);

/** The cleanest title among a product's listings: not all caps, then the shortest. */
function pickTitle(listings: SourceListing[]): string {
  const ranked = [...listings].sort(
    (a, b) => Number(isShouting(a.title)) - Number(isShouting(b.title)) || a.title.length - b.title.length,
  );
  // Store marketing that leaks into titles ("... Free Shipping") is not part of the name.
  const t = ranked[0].title.replace(/\s*[-|]?\s*free shipping\s*$/i, "").replace(/\s{2,}/g, " ");
  return isShouting(t) ? titleCase(t) : t;
}

function mostCommon<T>(xs: T[]): T {
  const counts = new Map<T, number>();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function toOffer(l: SourceListing, rates: Record<string, number>): Offer {
  const rate = rates[l.currency];
  const usd = (minor: number) => Math.round(minor / rate);
  const variants = l.variants.map((v) => ({
    option: normaliseOption(v.title),
    priceCents: usd(v.priceMinor),
    available: v.available,
  }));
  const inStock = variants.filter((v) => v.available);
  const cheapest = Math.min(...(inStock.length ? inStock : variants).map((v) => v.priceCents));
  const compare = l.variants.find((v) => v.compareAtMinor && v.compareAtMinor > v.priceMinor)?.compareAtMinor;
  return {
    sourceId: l.sourceId,
    listingId: l.externalId,
    url: l.url,
    priceCents: cheapest,
    compareAtCents: compare ? usd(compare) : null,
    currency: l.currency,
    sourcePriceMinor: Math.min(...l.variants.map((v) => v.priceMinor)),
    available: inStock.length > 0,
    variants,
    fetchedAt: l.fetchedAt,
  };
}

/**
 * Stores list sizes in their own order, so a merged list arrives as 8..15, 7, 7.5, 16.
 * Sizes sort numerically; anything that is not a size keeps the source order.
 */
export function sortOptions<T extends { option: string }>(options: T[]): T[] {
  const num = (o: string) => (/^\d+(\.\d+)?Y?$/i.test(o) ? parseFloat(o) : NaN);
  if (!options.every((o) => !Number.isNaN(num(o.option)))) return options;
  return [...options].sort((a, b) => num(a.option) - num(b.option));
}

/** Cheapest in stock wins; with nothing in stock, the cheapest overall. */
export function bestOffer(offers: Offer[]): Offer {
  const pool = offers.some((o) => o.available) ? offers.filter((o) => o.available) : offers;
  return pool.reduce((best, o) => (o.priceCents < best.priceCents ? o : best));
}

function buildProduct(id: string, listings: SourceListing[], styleCode: string | null, rates: Record<string, number>): Product {
  const offers = listings.map((l) => toOffer(l, rates));
  const best = bestOffer(offers);
  const lead = listings[offers.indexOf(best)];

  const options = new Map<string, { option: string; available: boolean; priceCents: number }>();
  for (const o of offers) {
    for (const v of o.variants) {
      const seen = options.get(v.option);
      if (!seen) options.set(v.option, { ...v });
      else if (v.available && (!seen.available || v.priceCents < seen.priceCents)) options.set(v.option, { ...v });
    }
  }

  const reviews = listings.flatMap((l) => l.reviews).sort((a, b) => b.date.localeCompare(a.date));
  const reviewCount = listings.reduce((n, l) => n + l.reviewCount, 0);
  const rated = listings.filter((l) => l.rating !== null);
  const rating = rated.length
    ? Math.round((rated.reduce((s, l) => s + l.rating! * l.reviewCount, 0) / rated.reduce((s, l) => s + l.reviewCount, 0)) * 10) / 10
    : null;

  return {
    id,
    title: pickTitle(listings),
    brand: normaliseBrand(mostCommon(listings.map((l) => normaliseBrand(l.brand)))),
    department: mostCommon(listings.map((l) => l.department)),
    description: listings.map((l) => l.description).sort((a, b) => b.length - a.length)[0],
    images: lead.images.length ? lead.images : listings.find((l) => l.images.length)!.images,
    styleCode,
    priceCents: best.priceCents,
    compareAtCents: best.compareAtCents,
    available: offers.some((o) => o.available),
    options: sortOptions([...options.values()]),
    rating,
    reviewCount,
    reviews,
    tags: [...new Set(listings.flatMap((l) => l.tags))],
    offers,
  };
}

export function buildCatalog(snapshot: Snapshot): Catalog {
  const groups = new Map<string, { code: string | null; listings: SourceListing[] }>();
  for (const l of snapshot.listings) {
    const code = styleCodeOf(l);
    const key = code ?? `${l.sourceId}-${l.externalId}`;
    const g = groups.get(key) ?? { code, listings: [] };
    // One listing per source per product: a store listing the same code twice
    // (a restock, a kids' run) keeps its first listing.
    if (!g.listings.some((x) => x.sourceId === l.sourceId)) g.listings.push(l);
    groups.set(key, g);
  }

  const products = [...groups.entries()].map(([key, g]) =>
    buildProduct(key.toLowerCase(), g.listings, g.code, snapshot.fx.rates),
  );
  return {
    takenAt: snapshot.takenAt,
    sources: snapshot.sources,
    products,
    byId: new Map(products.map((p) => [p.id, p])),
  };
}
