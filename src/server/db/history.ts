import type { Product } from "../catalog/catalog.ts";
import type { Recheck } from "../checkout/recheck.ts";
import type { Quote } from "../cart/quote.ts";
import { envName, maybe } from "./index.ts";

// Writes and reads what the stores said and when: price points from the snapshot,
// the daily sync and every checkout re-check, and the orders placed.

export type Reading = { seenAt: string; priceCents: number; available: boolean; origin: "snapshot" | "sync" | "recheck"; stores: number };

/** The re-check read these offers from their stores; each becomes a price point. */
export async function recordRecheck(r: Recheck): Promise<void> {
  if (r.readings.length === 0) return;
  const env = envName();
  await maybe(undefined, async (sql) => {
    await sql`insert into price_points ${sql(r.readings.map((x) => ({ ...x, env, origin: "recheck", seen_at: r.checkedAt })))}`;
  });
}

export async function recordOrder(invoiceId: string, number: string | null, q: Quote, by: "human" | "agent"): Promise<void> {
  const env = envName();
  await maybe(undefined, async (sql) => {
    await sql`insert into orders ${sql({ invoice_id: invoiceId, env, number, total_cents: q.totalCents, placed_by: by })} on conflict do nothing`;
    const lines = q.lines
      .filter((l) => l.fulfilledBy)
      .map((l) => ({ invoice_id: invoiceId, product_id: l.productId, option: l.option, qty: l.qty, unit_cents: l.unitCents, source_id: l.fulfilledBy!.sourceId, listing_id: l.fulfilledBy!.listingId }));
    if (lines.length) await sql`insert into order_lines ${sql(lines)}`;
  });
}

/**
 * The product's price over time, one reading per moment it was read: Hubit's price
 * then (the cheapest store with it in stock, else the cheapest), and how many
 * stores were read.
 */
export async function priceHistory(product: Product): Promise<Reading[]> {
  const env = envName();
  const rows = await maybe([] as { seen_at: Date; source_id: string; price_cents: number; available: boolean; origin: Reading["origin"] }[], (sql) =>
    sql`select seen_at, source_id, price_cents, available, origin from price_points
        where product_id = ${product.id} and env in (${env}, 'snapshot')
        order by seen_at asc limit 500`,
  );
  const byMoment = new Map<string, typeof rows>();
  for (const r of rows) {
    const k = new Date(r.seen_at).toISOString();
    byMoment.set(k, [...(byMoment.get(k) ?? []), r]);
  }
  return [...byMoment.entries()].map(([seenAt, group]) => {
    const pool = group.some((g) => g.available) ? group.filter((g) => g.available) : group;
    return {
      seenAt,
      priceCents: Math.min(...pool.map((g) => g.price_cents)),
      available: group.some((g) => g.available),
      origin: group[0].origin,
      stores: new Set(group.map((g) => g.source_id)).size,
    };
  });
}

export type StoreStatus = { sourceId: string; lastAttemptAt: string | null; lastOkAt: string | null; lastError: string | null; listings: number | null };

export async function storeStatuses(): Promise<Map<string, StoreStatus>> {
  const env = envName();
  const rows = await maybe([] as { source_id: string; last_attempt_at: Date | null; last_ok_at: Date | null; last_error: string | null; listings: number | null }[], (sql) =>
    sql`select source_id, last_attempt_at, last_ok_at, last_error, listings from source_status where env = ${env}`,
  );
  return new Map(
    rows.map((r) => [
      r.source_id,
      {
        sourceId: r.source_id,
        lastAttemptAt: r.last_attempt_at?.toISOString() ?? null,
        lastOkAt: r.last_ok_at?.toISOString() ?? null,
        lastError: r.last_error,
        listings: r.listings,
      },
    ]),
  );
}
