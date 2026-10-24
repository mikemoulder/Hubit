import type { Offer, Product } from "./catalog.ts";

// The backend's half of "one cart, many sources": for each line the shopper adds,
// pick the store that fulfils it. The shopper never chooses a store; Hubit does,
// per option, so size 9 can come from one shop and size 11 from another.

export type Route = {
  offer: Offer;
  priceCents: number;
};

export type RouteMiss = { reason: "unknown-option" | "sold-out" };

export function route(product: Product, option: string): Route | RouteMiss {
  const candidates = product.offers.flatMap((offer) => {
    const v = offer.variants.find((x) => x.option === option);
    return v ? [{ offer, variant: v }] : [];
  });
  if (candidates.length === 0) return { reason: "unknown-option" };
  const inStock = candidates.filter((c) => c.variant.available);
  if (inStock.length === 0) return { reason: "sold-out" };
  // Cheapest wins; on a tie, the source listed first in SOURCES order is kept.
  const pick = inStock.reduce((best, c) => (c.variant.priceCents < best.variant.priceCents ? c : best));
  return { offer: pick.offer, priceCents: pick.variant.priceCents };
}

export const isRoute = (r: Route | RouteMiss): r is Route => "offer" in r;
