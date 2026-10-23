import { departmentFor } from "../sources.ts";
import type { Source, SourceListing } from "../types.ts";
import { decimalToMinor, getJson, htmlToText } from "./http.ts";

// Shopify serves every storefront's public catalogue at /products.json. It carries
// prices, variants, stock and images, but no reviews and no barcodes (the public
// feed strips them), so matching across sources has to work from brand and title.

type ShopifyProduct = {
  id: number;
  title: string;
  handle: string;
  body_html: string | null;
  vendor: string;
  product_type: string;
  tags: string[] | string;
  variants: {
    id: number;
    title: string;
    sku: string | null;
    price: string;
    compare_at_price: string | null;
    available: boolean;
  }[];
  images: { src: string }[];
};

/**
 * /products.json prices in the shop's base currency, which /meta.json names.
 * Not /cart.js: that answers in the visitor's local currency (EUR from a European
 * IP) while the product prices stay in the base currency.
 */
async function shopCurrency(domain: string): Promise<string> {
  try {
    const { body } = await getJson<{ currency?: string }>(`https://${domain}/meta.json`, 10_000);
    return body.currency ?? "USD";
  } catch {
    // Some stores wall /meta.json off from bots. Every one of ours sells in USD.
    return "USD";
  }
}

export async function fetchShopify(source: Source, fetchedAt: string): Promise<SourceListing[]> {
  const [{ body }, currency] = await Promise.all([
    // country=US pins Shopify Markets to US pricing. Without it the store prices for
    // wherever the request comes from: Undefeated quotes $240 to a European server
    // for a shoe it sells for $215 in the US, under the same "USD" label.
    getJson<{ products: ShopifyProduct[] }>(`https://${source.domain}/products.json?limit=250&country=US`),
    shopCurrency(source.domain),
  ]);
  return body.products.map((p) => ({
    sourceId: source.id,
    externalId: String(p.id),
    url: `https://${source.domain}/products/${p.handle}`,
    title: p.title.trim(),
    brand: p.vendor?.trim() || source.name,
    department: departmentFor(source, p.product_type ?? "", p.title),
    sourceType: p.product_type ?? "",
    description: htmlToText(p.body_html),
    images: p.images.slice(0, 4).map((i) => i.src),
    currency,
    variants: p.variants.map((v) => ({
      externalId: String(v.id),
      title: v.title,
      sku: v.sku || null,
      priceMinor: decimalToMinor(v.price) ?? 0,
      compareAtMinor: decimalToMinor(v.compare_at_price),
      available: v.available,
    })),
    rating: null,
    reviewCount: 0,
    reviews: [],
    tags: (Array.isArray(p.tags) ? p.tags : p.tags.split(",")).map((t) => t.trim()).filter(Boolean),
    fetchedAt,
  }));
}
