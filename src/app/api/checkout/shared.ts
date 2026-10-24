import type { QuoteRequestLine } from "@/server/cart/quote";
import type { Recheck } from "@/server/checkout/recheck";

export function parseLines(raw: unknown): QuoteRequestLine[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return raw
    .filter((l) => l && typeof l.productId === "string" && typeof l.option === "string")
    .map((l) => ({ productId: l.productId, option: l.option, qty: Number(l.qty) }));
}

/** What the browser may see of a re-check: no store routing. */
export function forShopper(r: Recheck) {
  return { ...r, quote: { ...r.quote, lines: r.quote.lines.map((l) => ({ ...l, fulfilledBy: undefined })) } };
}
