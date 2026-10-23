// Free, local checks on the catalogue core, run before anything reaches a PR:
//   node --test test/
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { bestOffer, buildCatalog, normaliseBrand, normaliseOption } from "../src/server/catalog/catalog.ts";
import { totalsFor } from "../src/server/catalog/pricing.ts";
import { isRoute, route } from "../src/server/catalog/routing.ts";
import { search } from "../src/server/catalog/search.ts";
import type { Snapshot } from "../src/server/catalog/types.ts";

const snapshot: Snapshot = JSON.parse(readFileSync(new URL("../data/catalog-snapshot.json", import.meta.url), "utf8"));
const catalog = buildCatalog(snapshot);

test("fees: shipping under $75, free from $75, 5% service fee rounded half up", () => {
  assert.deepEqual(totalsFor(5000), { subtotalCents: 5000, shippingCents: 699, serviceFeeCents: 250, totalCents: 5949 });
  assert.deepEqual(totalsFor(7500), { subtotalCents: 7500, shippingCents: 0, serviceFeeCents: 375, totalCents: 7875 });
  assert.equal(totalsFor(1010).serviceFeeCents, 51);
  assert.equal(totalsFor(0).totalCents, 0);
});

test("options and brands normalise across stores", () => {
  assert.equal(normaliseOption("- / 9.5"), "9.5");
  assert.equal(normaliseOption("Default Title"), "One size");
  assert.equal(normaliseOption("- / 4.5y"), "4.5Y");
  assert.equal(normaliseBrand("Air Jordan"), "Jordan");
  assert.equal(normaliseBrand("JORDAN BRAND"), "Jordan");
  assert.equal(normaliseBrand("OAKLEY"), "Oakley");
});

test("the same style code from several stores becomes one product", () => {
  const matched = catalog.products.filter((p) => p.offers.length > 1);
  assert.ok(matched.length >= 20, `only ${matched.length} matched products`);
  for (const p of matched) {
    assert.ok(p.styleCode, `${p.id} matched without a style code`);
    assert.equal(new Set(p.offers.map((o) => o.sourceId)).size, p.offers.length, `${p.id} has two offers from one store`);
  }
});

test("a product's price is its best offer: cheapest in stock", () => {
  for (const p of catalog.products) {
    const best = bestOffer(p.offers);
    assert.equal(p.priceCents, best.priceCents, p.id);
    if (p.offers.some((o) => o.available)) assert.ok(best.available, p.id);
  }
});

test("non-USD sources are converted at the snapshot rate", () => {
  const joco = catalog.products.find((p) => p.offers[0].sourceId === "joco")!;
  const o = joco.offers[0];
  assert.equal(o.currency, "AUD");
  assert.equal(o.priceCents, Math.round(o.sourcePriceMinor / snapshot.fx.rates.AUD));
});

test("routing picks the cheapest in-stock store for the chosen option", () => {
  const multi = catalog.products.find((p) => p.offers.length > 2 && p.options.length > 3)!;
  for (const { option } of multi.options) {
    const r = route(multi, option);
    const holders = multi.offers.filter((o) => o.variants.some((v) => v.option === option && v.available));
    if (holders.length === 0) {
      assert.ok(!isRoute(r));
      continue;
    }
    assert.ok(isRoute(r));
    const cheapest = Math.min(...holders.map((o) => o.variants.find((v) => v.option === option)!.priceCents));
    assert.equal(r.priceCents, cheapest, `${multi.id} size ${option}`);
  }
  assert.deepEqual(route(multi, "no-such-size"), { reason: "unknown-option" });
});

test("search: every word must match, facets ignore their own filter", () => {
  const r = search(catalog, { q: "jordan retro" });
  assert.ok(r.total > 0);
  for (const p of r.items) assert.match(`${p.title} ${p.brand} ${p.description} ${p.tags.join(" ")}`.toLowerCase(), /jordan/);
  const shoes = search(catalog, { department: "footwear" });
  assert.ok(shoes.items.every((p) => p.department === "footwear"));
  assert.ok(shoes.facets.departments.length > 1, "department facet collapsed to the selected one");
  const asc = search(catalog, { sort: "price-asc", pageSize: 96 }).items.map((p) => p.priceCents);
  assert.deepEqual(asc, [...asc].sort((a, b) => a - b));
  assert.equal(search(catalog, { q: "zzzqqq" }).total, 0);
});
