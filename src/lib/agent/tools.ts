"use client";

import { addLine, getLines, removeLine, MAX_QTY } from "@/lib/cart";
import { money } from "@/lib/format";
import type { ProductDetail, ProductSummary } from "@/server/catalog/present";
import type { Quote } from "@/server/cart/quote";
import type { ToolDef, ToolResult } from "./webmcp";

// The five tools Hubit offers an agent. They read the same server APIs the pages
// do and write to the shopper's own cart, marking each line as the agent's. There
// is deliberately no sixth: nothing here can pay, check out or see card details.

const ok = (text: string): ToolResult => ({ content: [{ type: "text", text }] });
const fail = (text: string): ToolResult => ({ content: [{ type: "text", text }], isError: true });

const field = (input: unknown, key: string): unknown => (input && typeof input === "object" ? (input as Record<string, unknown>)[key] : undefined);
const text = (input: unknown, key: string) => {
  const v = field(input, key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function readCart(): Promise<Quote> {
  return getJson<Quote>("/api/cart/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines: getLines().map(({ productId, option, qty }) => ({ productId, option, qty })) }),
  });
}

export function describeCart(q: Quote): string {
  if (q.lines.length === 0) return "Your cart is empty.";
  const rows = q.lines.map((l) => `${l.qty} × ${l.title}${l.option !== "One size" ? ` (${l.option})` : ""} ${l.problem ? "unavailable" : money(l.lineCents)}`);
  return `${rows.join("; ")}. Items ${money(q.subtotalCents)}, shipping ${q.shippingCents ? money(q.shippingCents) : "free"}, service fee ${money(q.serviceFeeCents)}, total ${money(q.totalCents)}.`;
}

export const TOOLS: ToolDef[] = [
  {
    name: "search_catalog",
    description: "Search Hubit's catalogue of products from 28 stores. Every word must match the title, brand, tags, department or style code.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string" },
        department: { type: "string", enum: ["footwear", "apparel", "beauty", "home", "kitchen", "accessories", "audio-tech", "outdoor", "desk", "food-drink"] },
        sort: { type: "string", enum: ["featured", "price-asc", "price-desc", "rating"] },
        inStock: { type: "boolean" },
        maxPrice: { type: "number", description: "Dollars" },
      },
    },
    annotations: { readOnlyHint: true },
    async execute(input) {
      const params = new URLSearchParams({ pageSize: "10" });
      for (const [k, p] of [["q", "q"], ["department", "dept"], ["sort", "sort"]] as const) {
        const v = text(input, k);
        if (v) params.set(p, v);
      }
      if (field(input, "inStock") === true) params.set("stock", "1");
      const max = Number(field(input, "maxPrice"));
      if (Number.isFinite(max) && max > 0) params.set("max", String(max));
      const r = await getJson<{ total: number; items: ProductSummary[] }>(`/api/search?${params}`);
      if (r.total === 0) return ok("No products match.");
      const rows = r.items.map((p) => `${p.title} (${p.id}), ${money(p.priceCents)}${p.available ? "" : ", sold out"}`);
      return ok(`${r.total} results; first ${r.items.length}: ${rows.join("; ")}`);
    },
  },
  {
    name: "get_product",
    description: "Read one product: price, options (sizes) with stock, description and reviews.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    annotations: { readOnlyHint: true },
    async execute(input) {
      const id = text(input, "id");
      if (!id) return fail("Give a product id from search_catalog.");
      const p = await getJson<ProductDetail>(`/api/products/${encodeURIComponent(id)}`).catch(() => null);
      if (!p) return fail(`No product ${id}.`);
      const options = p.options.map((o) => `${o.option}${o.available ? "" : " (sold out)"}`).join(", ");
      return ok(`${p.title} by ${p.brand}, ${money(p.priceCents)}. Options: ${options}. ${p.reviewCount} reviews.`);
    },
  },
  {
    name: "add_to_cart",
    description: "Add a product to the shopper's cart. The line is marked as added by the agent.",
    inputSchema: {
      type: "object",
      properties: { productId: { type: "string" }, option: { type: "string" }, qty: { type: "number" } },
      required: ["productId", "option"],
    },
    async execute(input) {
      const id = text(input, "productId");
      const option = text(input, "option");
      const qty = Math.floor(Number(field(input, "qty") ?? 1));
      if (!id || !option) return fail("Give productId and option (use 'One size' when there is only one).");
      if (!(qty >= 1 && qty <= MAX_QTY)) return fail(`qty must be 1 to ${MAX_QTY}.`);
      const p = await getJson<ProductDetail>(`/api/products/${encodeURIComponent(id)}`).catch(() => null);
      if (!p) return fail(`No product ${id}.`);
      const o = p.options.find((x) => x.option === option);
      if (!o) return fail(`${p.title} has no option "${option}". Options: ${p.options.map((x) => x.option).join(", ")}.`);
      if (!o.available) return fail(`${p.title} in ${option} is sold out at every store.`);
      addLine(id, option, qty, "agent");
      return ok(`Added ${qty} × ${p.title}${option !== "One size" ? `, ${option}` : ""} at ${money(o.priceCents)} each.`);
    },
  },
  {
    name: "remove_from_cart",
    description: "Remove a line from the shopper's cart.",
    inputSchema: { type: "object", properties: { productId: { type: "string" }, option: { type: "string" } }, required: ["productId", "option"] },
    async execute(input) {
      const id = text(input, "productId");
      const option = text(input, "option");
      if (!id || !option) return fail("Give productId and option.");
      if (!getLines().some((l) => l.productId === id && l.option === option)) return fail("That line is not in the cart.");
      removeLine(id, option);
      return ok("Removed.");
    },
  },
  {
    name: "view_cart",
    description: "Read the shopper's cart with Hubit's prices and fees, as the server works them out.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    async execute() {
      return ok(describeCart(await readCart()));
    },
  },
];
