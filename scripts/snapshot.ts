// Takes the frozen catalogue that PR previews and tests run against:
//   node scripts/snapshot.ts [perSource]
// Live prices move every day; a committed snapshot keeps every assertion exact.
import { writeFileSync } from "node:fs";
import { ingest } from "../src/server/catalog/ingest.ts";
import { SOURCES } from "../src/server/catalog/sources.ts";

const perSource = Number(process.argv[2] ?? 40);
const snap = await ingest(SOURCES, perSource);
writeFileSync(new URL("../data/catalog-snapshot.json", import.meta.url), JSON.stringify(snap, null, 1) + "\n");

const bySource = new Map<string, number>();
for (const l of snap.listings) bySource.set(l.sourceId, (bySource.get(l.sourceId) ?? 0) + 1);
for (const s of SOURCES) console.log(`${s.id.padEnd(14)} ${String(bySource.get(s.id) ?? 0).padStart(3)}`);
for (const e of snap.errors) console.log(`FAILED ${e.sourceId}: ${e.error}`);
console.log(`${snap.listings.length} listings from ${bySource.size}/${SOURCES.length} sources, FX ${snap.fx.date}`);
