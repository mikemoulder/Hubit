import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getJson } from "../catalog/adapters/http.ts";
import { normaliseOption, type Catalog, type Offer, type OfferVariant, type Product } from "../catalog/catalog.ts";
import { quote, type Quote, type QuoteRequestLine } from "../cart/quote.ts";

// Before payment, every line is read again from its stores. Prices move and sizes
// sell out between the snapshot and the moment someone pays; this is where Hubit
// finds out, re-routes if another store still has the size, and tells the shopper.

export type Change = {
  productId: string;
  option: string;
  title: string;
  kind: "price-up" | "price-down" | "sold-out";
  fromCents: number;
  toCents: number;
};

export type Recheck = { quote: Quote; changes: Change[]; checkedAt: string; mode: "live" | "snapshot" };

export interface SourceReader {
  /** The offer's variants as the store reports them now, or null if it could not be reached. */
  read(offer: Offer): Promise<OfferVariant[] | null>;
}

type Drift = { sourceId: string; listingId: string; option?: string; priceCents?: number; available?: boolean };

/**
 * Previews and tests read the snapshot, plus a small committed file of drift: the
 * changes a store "made" since the snapshot. That keeps the re-check deterministic
 * while still exercising every branch of it.
 */
export function snapshotReader(drift: Drift[] = loadDrift()): SourceReader {
  return {
    async read(offer) {
      return offer.variants.map((v) => {
        const d = drift.find(
          (x) => x.sourceId === offer.sourceId && x.listingId === offer.listingId && (!x.option || x.option === v.option),
        );
        return d ? { ...v, priceCents: d.priceCents ?? v.priceCents, available: d.available ?? v.available } : v;
      });
    },
  };
}

function loadDrift(): Drift[] {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "data", "recheck-drift.json"), "utf8")).drift;
  } catch {
    return [];
  }
}

/** Production reads each store's own product endpoint again. */
export function liveReader(fx: Record<string, number>, currencyOf: (o: Offer) => string): SourceReader {
  return {
    async read(offer) {
      const rate = fx[currencyOf(offer)] ?? 1;
      try {
        if (offer.url.includes("/products/")) {
          const { body } = await getJson<{ variants: { title: string; price: number; available: boolean }[] }>(
            `${offer.url}.js?country=US`,
            6000,
          );
          return body.variants.map((v) => ({ option: normaliseOption(v.title), priceCents: Math.round(v.price / rate), available: v.available }));
        }
        const host = new URL(offer.url).host;
        const { body } = await getJson<{ prices: { price: string; currency_minor_unit: number }; is_in_stock: boolean }>(
          `https://${host}/wp-json/wc/store/v1/products/${offer.listingId}`,
          6000,
        );
        const minor = Math.round(Number(body.prices.price) * 10 ** (2 - body.prices.currency_minor_unit));
        return offer.variants.map((v) => ({ ...v, priceCents: Math.round(minor / rate), available: body.is_in_stock }));
      } catch {
        return null;
      }
    },
  };
}

export function readerFor(catalog: Catalog, snapshotFx: Record<string, number>): { reader: SourceReader; mode: Recheck["mode"] } {
  const live = process.env.HUBIT_RECHECK === "live" || (process.env.HUBIT_RECHECK !== "snapshot" && process.env.VERCEL_ENV === "production");
  if (!live) return { reader: snapshotReader(), mode: "snapshot" };
  return { reader: liveReader(snapshotFx, (o) => o.currency), mode: "live" };
}

async function refreshed(product: Product, option: string, reader: SourceReader): Promise<Product> {
  const offers = await Promise.all(
    product.offers.map(async (o) => {
      if (!o.variants.some((v) => v.option === option)) return o;
      const now = await reader.read(o);
      // A store we could not reach keeps its snapshot reading rather than vanishing.
      return now ? { ...o, variants: now } : o;
    }),
  );
  return { ...product, offers };
}

export async function recheck(catalog: Catalog, lines: QuoteRequestLine[], reader: SourceReader, mode: Recheck["mode"]): Promise<Recheck> {
  const before = quote(catalog, lines);
  const fresh = new Map<string, Product>();
  await Promise.all(
    lines.map(async (l) => {
      const p = catalog.byId.get(l.productId);
      if (p) fresh.set(`${l.productId}|${l.option}`, await refreshed(p, l.option, reader));
    }),
  );
  const after = quote(catalog, lines, (id, option) => fresh.get(`${id}|${option}`) ?? catalog.byId.get(id));

  const changes: Change[] = [];
  after.lines.forEach((now, i) => {
    const was = before.lines[i];
    if (was.problem) return;
    if (now.problem === "sold-out") {
      changes.push({ productId: now.productId, option: now.option, title: now.title, kind: "sold-out", fromCents: was.unitCents, toCents: 0 });
    } else if (!now.problem && now.unitCents !== was.unitCents) {
      changes.push({
        productId: now.productId,
        option: now.option,
        title: now.title,
        kind: now.unitCents > was.unitCents ? "price-up" : "price-down",
        fromCents: was.unitCents,
        toCents: now.unitCents,
      });
    }
  });
  return { quote: after, changes, checkedAt: new Date().toISOString(), mode };
}
