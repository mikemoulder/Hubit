import type { Catalog, Product } from "../catalog/catalog.ts";
import { totalsFor, type Totals } from "../catalog/pricing.ts";
import { isRoute, route } from "../catalog/routing.ts";

// Prices a cart on the server. The browser sends only product, option and
// quantity; everything with money in it is decided here, against the catalogue.

export type QuoteRequestLine = { productId: string; option: string; qty: number };

export type QuoteLine = QuoteRequestLine & {
  title: string;
  brand: string;
  image: string | null;
  unitCents: number;
  lineCents: number;
  /** Why this line cannot be bought right now; absent when it can. */
  problem?: "not-found" | "unknown-option" | "sold-out";
  /** The store this line is routed to. Shown to operators, not to shoppers. */
  fulfilledBy?: { sourceId: string; listingId: string; url: string };
};

export type Quote = Totals & { lines: QuoteLine[]; itemCount: number; purchasable: boolean };

export const MAX_LINES = 50;
export const MAX_QTY = 10;

/** Looks a product up for one line; the re-check passes freshly read products here. */
export type ProductLookup = (productId: string, option: string) => Product | undefined;

export function quote(catalog: Catalog, request: QuoteRequestLine[], lookup?: ProductLookup): Quote {
  const lines: QuoteLine[] = request.slice(0, MAX_LINES).map((req) => {
    const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(req.qty) || 1));
    const product = lookup ? lookup(req.productId, req.option) : catalog.byId.get(req.productId);
    if (!product) {
      return { ...req, qty, title: "Unavailable item", brand: "", image: null, unitCents: 0, lineCents: 0, problem: "not-found" };
    }
    const base = { productId: product.id, option: req.option, qty, title: product.title, brand: product.brand, image: product.images[0] ?? null };
    const r = route(product, req.option);
    if (!isRoute(r)) return { ...base, unitCents: 0, lineCents: 0, problem: r.reason };
    return {
      ...base,
      unitCents: r.priceCents,
      lineCents: r.priceCents * qty,
      fulfilledBy: { sourceId: r.offer.sourceId, listingId: r.offer.listingId, url: r.offer.url },
    };
  });

  const ok = lines.filter((l) => !l.problem);
  const totals = totalsFor(ok.reduce((sum, l) => sum + l.lineCents, 0));
  return {
    ...totals,
    lines,
    itemCount: ok.reduce((n, l) => n + l.qty, 0),
    purchasable: ok.length > 0 && ok.length === lines.length,
  };
}
