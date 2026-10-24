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

test("merged sizes are listed in numeric order", () => {
  for (const p of catalog.products) {
    const nums = p.options.map((o) => o.option);
    if (!nums.every((o) => /^\d+(\.\d+)?Y?$/i.test(o))) continue;
    const vals = nums.map((o) => parseFloat(o));
    assert.deepEqual(vals, [...vals].sort((a, b) => a - b), p.id);
  }
});

test("sneakers are footwear wherever they are sold", () => {
  for (const p of catalog.products.filter((x) => x.offers.length > 1 && /\b(jordan \d|air max|foamposite|dunk)\b/i.test(x.title))) {
    assert.equal(p.department, "footwear", `${p.id} ${p.title}`);
  }
});

test("every editorial photograph points at a product in the snapshot", async () => {
  const { PICKS } = await import("../src/server/editorial.ts");
  for (const [key, pick] of Object.entries(PICKS)) {
    const p = catalog.byId.get(pick.productId);
    assert.ok(p, `${key}: ${pick.productId} is not in the catalogue`);
    assert.ok(p.images[pick.image], `${key}: image ${pick.image} missing`);
  }
});

test("re-check: a price rise, a sell-out and a silent re-route are all found", async () => {
  const { recheck, snapshotReader } = await import("../src/server/checkout/recheck.ts");
  const drift = JSON.parse(readFileSync(new URL("../data/recheck-drift.json", import.meta.url), "utf8")).drift;
  const lines = [
    { productId: "nalgene-789703", option: "One size", qty: 2 },
    { productId: "ugmonk-8677665996950", option: "One size", qty: 1 },
    { productId: "hq7978-001", option: "9", qty: 1 },
  ];
  const r = await recheck(catalog, lines, snapshotReader(drift), "snapshot");
  assert.deepEqual(
    r.changes.map((c) => [c.productId, c.kind, c.fromCents, c.toCents]),
    [
      ["nalgene-789703", "price-up", 1899, 2199],
      ["ugmonk-8677665996950", "sold-out", 12900, 0],
    ],
  );
  // The shoe still costs $215, so the shopper hears nothing, but it ships from another store.
  const shoe = r.quote.lines[2];
  assert.equal(shoe.unitCents, 21500);
  assert.notEqual(shoe.fulfilledBy?.sourceId, "undefeated");
  assert.equal(r.quote.purchasable, false, "a sold-out line blocks payment until removed");
  assert.equal(r.quote.subtotalCents, 2199 * 2 + 21500);
});

test("search ignores words that appear only in a description", () => {
  const mugs = search(catalog, { q: "mug", pageSize: 50 }).items.map((p) => p.title);
  assert.equal(mugs.length, 5);
  for (const t of mugs) assert.ok(/mug|bundle/i.test(t), `"${t}" is not a mug`);
  assert.ok(!mugs.includes("Pumpkin Spice Suncatcher"));
  assert.equal(search(catalog, { q: "mug", department: "kitchen" }).total, 4);
  assert.equal(search(catalog, { q: "jordan 5" }).total, 27);
});

test("reviewers known only by an initial are shown as verified buyers", async () => {
  const { reviewerName, detail } = await import("../src/server/catalog/present.ts");
  assert.equal(reviewerName("T"), "Verified buyer T.");
  assert.equal(reviewerName("kb"), "Verified buyer kb.");
  assert.equal(reviewerName("Aden Cornelison"), "Aden Cornelison");
  const pride = detail(catalog.byId.get("nalgene-748191")!);
  assert.equal(pride.reviews[0].author, "Verified buyer T.");
  assert.ok(pride.reviews.every((r) => r.author.length >= 3));
});
