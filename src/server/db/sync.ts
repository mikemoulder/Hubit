import { fetchShopify } from "../catalog/adapters/shopify.ts";
import { fetchWooCommerce } from "../catalog/adapters/woocommerce.ts";
import { styleCodeOf, type Catalog } from "../catalog/catalog.ts";
import { fetchFx } from "../catalog/ingest.ts";
import type { Source, SourceListing } from "../catalog/types.ts";
import { envName, maybe } from "./index.ts";

// The daily store sync. Reads the stores again, least recently read first, until
// the time budget runs out, and records each listing's price for the products
// Hubit sells, plus whether each store answered.

const READ: Record<string, (s: Source, at: string) => Promise<SourceListing[]>> = {
  shopify: fetchShopify,
  woocommerce: (s, at) => fetchWooCommerce(s, at, { reviews: false }),
};

export type SyncResult = { read: string[]; failed: { sourceId: string; error: string }[]; points: number };

export async function syncStores(catalog: Catalog, budgetMs = 35_000, concurrency = 7): Promise<SyncResult> {
  const started = Date.now();
  const env = envName();
  const at = new Date().toISOString();
  const fx = await fetchFx().catch(() => null);

  const last = await maybe([] as { source_id: string; last_attempt_at: Date | null }[], (sql) => sql`select source_id, last_attempt_at from source_status where env = ${env}`);
  const when = new Map(last.map((r) => [r.source_id, r.last_attempt_at?.getTime() ?? 0]));
  const queue = [...catalog.sources].sort((a, b) => (when.get(a.id) ?? 0) - (when.get(b.id) ?? 0));

  const result: SyncResult = { read: [], failed: [], points: 0 };
  async function worker() {
    for (let s = queue.shift(); s; s = queue.shift()) {
      if (Date.now() - started > budgetMs) return;
      const read = READ[s.platform];
      try {
        if (!read) throw new Error(`No reader for ${s.platform}`);
        const listings = await read(s, at);
        const points = listings.flatMap((l) => {
          const id = (styleCodeOf(l) ?? `${l.sourceId}-${l.externalId}`).toLowerCase();
          const rate = fx?.rates[l.currency];
          if (!catalog.byId.has(id) || !rate) return [];
          const stocked = l.variants.filter((v) => v.available);
          const pool = stocked.length ? stocked : l.variants;
          if (pool.length === 0) return [];
          const price = Math.round(Math.min(...pool.map((v) => v.priceMinor)) / rate);
          return [{ env, product_id: id, source_id: s.id, listing_id: l.externalId, price_cents: price, available: stocked.length > 0, origin: "sync", seen_at: at }];
        });
        await maybe(undefined, async (sql) => {
          for (let i = 0; i < points.length; i += 500) await sql`insert into price_points ${sql(points.slice(i, i + 500))}`;
          await sql`insert into source_status ${sql({ env, source_id: s.id, name: s.name, platform: s.platform, last_attempt_at: at, last_ok_at: at, last_error: null, listings: listings.length })}
            on conflict (env, source_id) do update set last_attempt_at = excluded.last_attempt_at, last_ok_at = excluded.last_ok_at, last_error = null, listings = excluded.listings`;
        });
        result.read.push(s.id);
        result.points += points.length;
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        result.failed.push({ sourceId: s.id, error });
        await maybe(undefined, async (sql) => {
          await sql`insert into source_status ${sql({ env, source_id: s.id, name: s.name, platform: s.platform, last_attempt_at: at, last_error: error })}
            on conflict (env, source_id) do update set last_attempt_at = excluded.last_attempt_at, last_error = excluded.last_error`;
        });
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  await maybe(undefined, async (sql) => {
    await sql`insert into sync_runs ${sql({ env, started_at: at, finished_at: new Date().toISOString(), sources_ok: result.read.length, sources_failed: result.failed.length, points: result.points })}`;
  });
  return result;
}
