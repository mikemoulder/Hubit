import { fetchShopify } from "./adapters/shopify.ts";
import { fetchWooCommerce } from "./adapters/woocommerce.ts";
import { getJson } from "./adapters/http.ts";
import type { FxRates, Snapshot, Source, SourceListing } from "./types.ts";

// Listings that are not things a shopper can buy: CMS content entries, internal
// SKUs, return labels, samples, spare parts, gift cards.
const NOT_FOR_SALE = /\b(content|internal|return|sample|replacement part|gift ?card|warehouse|e-?gift|donation|shipping protection|route)\b/i;

function sellable(l: SourceListing): boolean {
  if (NOT_FOR_SALE.test(l.sourceType) || NOT_FOR_SALE.test(l.title)) return false;
  if (l.images.length === 0) return false;
  return l.variants.some((v) => v.priceMinor > 0);
}

const ADAPTERS = {
  shopify: fetchShopify,
  woocommerce: fetchWooCommerce,
  ebay: async () => {
    throw new Error("eBay adapter needs EBAY_CLIENT_ID and EBAY_CLIENT_SECRET");
  },
} satisfies Record<Source["platform"], (s: Source, at: string) => Promise<SourceListing[]>>;

export async function fetchFx(): Promise<FxRates> {
  const { body } = await getJson<{ date: string; rates: Record<string, number> }>(
    "https://api.frankfurter.dev/v1/latest?base=USD",
  );
  return { base: "USD", date: body.date, rates: { USD: 1, ...body.rates } };
}

/**
 * Reads every source, a few at a time, and keeps up to `perSource` sellable
 * listings from each. One failing store is recorded and skipped, never fatal.
 */
export async function ingest(sources: Source[], perSource: number, concurrency = 4): Promise<Snapshot> {
  const takenAt = new Date().toISOString();
  const fx = await fetchFx();
  const listings: SourceListing[] = [];
  const errors: Snapshot["errors"] = [];

  const queue = [...sources];
  async function worker() {
    for (let s = queue.shift(); s; s = queue.shift()) {
      try {
        const got = (await ADAPTERS[s.platform](s, takenAt)).filter(sellable);
        const missing = got.find((l) => !fx.rates[l.currency]);
        if (missing) throw new Error(`No FX rate for ${missing.currency}`);
        // Reviewed listings first, so the products we keep carry the reviews a source has.
        got.sort((a, b) => Number(b.reviewCount > 0) - Number(a.reviewCount > 0));
        listings.push(...got.slice(0, s.limit ?? perSource));
      } catch (e) {
        errors.push({ sourceId: s.id, error: e instanceof Error ? e.message : String(e) });
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  const order = new Map(sources.map((s, i) => [s.id, i]));
  listings.sort((a, b) => order.get(a.sourceId)! - order.get(b.sourceId)!);
  return { takenAt, fx, sources, listings, errors };
}
