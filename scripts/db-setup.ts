// Creates the tables and seeds the snapshot's prices as the first point of every
// product's price history:   node --env-file=.env.local scripts/db-setup.ts
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { buildCatalog } from "../src/server/catalog/catalog.ts";
import type { Snapshot } from "../src/server/catalog/types.ts";

const url = process.env.POSTGRES_URL_NON_POOLING;
if (!url) throw new Error("POSTGRES_URL_NON_POOLING is not set");
const sql = postgres(url, { max: 1 });

await sql.unsafe(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
console.log("schema applied");

const snapshot: Snapshot = JSON.parse(readFileSync(new URL("../data/catalog-snapshot.json", import.meta.url), "utf8"));
const catalog = buildCatalog(snapshot);
const rows = catalog.products.flatMap((p) =>
  p.offers.map((o) => ({
    env: "snapshot",
    product_id: p.id,
    source_id: o.sourceId,
    listing_id: o.listingId,
    price_cents: o.priceCents,
    available: o.available,
    origin: "snapshot",
    seen_at: snapshot.takenAt,
  })),
);
await sql`delete from price_points where env = 'snapshot'`;
for (let i = 0; i < rows.length; i += 500) await sql`insert into price_points ${sql(rows.slice(i, i + 500))}`;
const [{ n }] = await sql`select count(*)::int as n from price_points where env = 'snapshot'`;
console.log(`snapshot points: ${n} (${catalog.products.length} products)`);
await sql.end();
