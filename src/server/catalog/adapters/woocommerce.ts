import { departmentFor } from "../sources.ts";
import type { Review, Source, SourceListing } from "../types.ts";
import { getJson, htmlToText } from "./http.ts";

// WooCommerce's Store API (/wp-json/wc/store/v1) is public on most stores. Unlike
// Shopify it reports ratings and exposes the store's own written reviews, and it
// prices in the store's currency, so JOCO arrives in AUD and Superstitch in EUR.

type WooProduct = {
  id: number;
  name: string;
  permalink: string;
  sku: string;
  description: string;
  short_description: string;
  prices: {
    price: string;
    regular_price: string;
    sale_price: string;
    currency_code: string;
    currency_minor_unit: number;
  };
  average_rating: string;
  review_count: number;
  is_in_stock: boolean;
  categories: { name: string }[];
  tags: { name: string }[];
  images: { src: string }[];
};

type WooReview = {
  product_id: number;
  reviewer: string;
  rating: number;
  review: string;
  date_created: string;
};

/** Woo reports prices in the currency's minor unit; Hubit always stores two places. */
function toMinor(value: string, minorUnit: number): number {
  return Math.round(Number(value) * 10 ** (2 - minorUnit));
}

const reviewsPerProduct = 5;

export async function fetchWooCommerce(source: Source, fetchedAt: string): Promise<SourceListing[]> {
  const base = `https://${source.domain}/wp-json/wc/store/v1`;
  const { body: products } = await getJson<WooProduct[]>(`${base}/products?per_page=100`);

  // The newest reviews per reviewed product, one request each, a few at a time.
  const reviewsByProduct = new Map<number, Review[]>();
  const reviewed = products.filter((p) => p.review_count > 0).map((p) => p.id);
  async function worker() {
    for (let id = reviewed.shift(); id; id = reviewed.shift()) {
      const { body } = await getJson<WooReview[]>(`${base}/products/reviews?product_id=${id}&per_page=${reviewsPerProduct}`);
      reviewsByProduct.set(
        id,
        body.map((r) => ({
          author: r.reviewer.trim() || "Verified buyer",
          rating: r.rating,
          body: htmlToText(r.review, 800),
          date: r.date_created.slice(0, 10),
        })),
      );
    }
  }
  await Promise.all([worker(), worker(), worker()]);

  return products.map((p) => {
    const sourceType = p.categories.map((c) => c.name).join(", ");
    const price = toMinor(p.prices.price, p.prices.currency_minor_unit);
    const regular = toMinor(p.prices.regular_price, p.prices.currency_minor_unit);
    const rating = Number(p.average_rating);
    return {
      sourceId: source.id,
      externalId: String(p.id),
      url: p.permalink,
      title: htmlToText(p.name, 200),
      brand: source.name,
      department: departmentFor(source, sourceType, p.name),
      sourceType,
      description: htmlToText(p.short_description || p.description),
      images: p.images.slice(0, 4).map((i) => i.src),
      currency: p.prices.currency_code,
      // The Store API lists a variable product once, at its lowest price.
      variants: [
        {
          externalId: String(p.id),
          title: "Default",
          sku: p.sku || null,
          priceMinor: price,
          compareAtMinor: regular > price ? regular : null,
          available: p.is_in_stock,
        },
      ],
      rating: p.review_count > 0 && rating > 0 ? rating : null,
      reviewCount: p.review_count,
      reviews: reviewsByProduct.get(p.id) ?? [],
      tags: p.tags.map((t) => t.name),
      fetchedAt,
    };
  });
}
