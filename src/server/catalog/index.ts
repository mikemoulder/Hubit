import snapshot from "../../../data/catalog-snapshot.json" with { type: "json" };
import { buildCatalog, type Catalog } from "./catalog.ts";
import type { Snapshot } from "./types.ts";

// The catalogue every page and API route reads. Built once per server instance
// from the committed snapshot, so a preview, a test run and production all agree
// on every price until the snapshot is retaken.
let catalog: Catalog | null = null;

export function getCatalog(): Catalog {
  catalog ??= buildCatalog(snapshot as Snapshot);
  return catalog;
}

export function sourceName(id: string): string {
  return getCatalog().sources.find((s) => s.id === id)?.name ?? id;
}
