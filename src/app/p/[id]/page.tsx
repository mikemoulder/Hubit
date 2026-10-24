import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Store } from "lucide-react";
import { AddToCart } from "@/components/shop/AddToCart";
import { PriceHistory } from "@/components/shop/PriceHistory";
import { priceHistory } from "@/server/db/history";
import { money, sized, timeAgo } from "@/lib/format";
import { getCatalog } from "@/server/catalog";
import { detail } from "@/server/catalog/present";
import { DEPARTMENTS } from "@/server/catalog/sources";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getCatalog().byId.get((await params).id);
  return { title: p ? p.title : "Not found" };
}

export default async function ProductPage({ params }: Props) {
  const product = getCatalog().byId.get((await params).id);
  if (!product) notFound();
  const p = detail(product);
  const readings = await priceHistory(product);
  const dept = DEPARTMENTS.find((d) => d.id === p.department)!;

  return (
    <main className="px-[var(--margin)] pb-10 pt-4">
      <nav aria-label="Breadcrumb" className="text-[13px] text-[var(--color-muted)]">
        <Link href="/shop" className="hover:underline">Shop</Link> /{" "}
        <Link href={`/shop?dept=${dept.id}`} className="hover:underline">{dept.label}</Link> /{" "}
        <Link href={`/shop?brand=${encodeURIComponent(p.brand)}`} className="hover:underline">{p.brand}</Link>
      </nav>

      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-16">
        <div className="grid grid-cols-2 gap-2">
          {p.images.slice(0, 3).map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={sized(src, i === 0 ? 1000 : 500)}
              alt={i === 0 ? p.title : ""}
              className={`w-full bg-[#f6f6f6] object-cover ${i === 0 ? "col-span-2 aspect-square" : "aspect-square"}`}
            />
          ))}
        </div>

        <div className="md:sticky md:top-24 md:self-start">
          <p className="text-[15px] text-[var(--color-muted)]">{p.brand}</p>
          <h1 className="mt-1 text-[clamp(26px,2.4vw,36px)] font-semibold leading-tight tracking-[-0.02em]" data-testid="product-name">
            {p.title}
          </h1>
          <p className="mt-3 flex items-baseline gap-3">
            <span className="text-[26px] font-semibold tabular-nums" data-testid="price">
              {money(p.priceCents)}
            </span>
            {p.compareAtCents && <s className="text-sm text-[var(--color-muted)] tabular-nums">{money(p.compareAtCents)}</s>}
          </p>
          {p.rating !== null && (
            <a href="#reviews" className="link-line mt-2 flex items-center gap-1 text-[15px]">
              <Star className="size-4 fill-[var(--color-ink)] text-[var(--color-ink)]" aria-hidden />
              <span className="tabular-nums">{p.rating.toFixed(1)}</span> from <span className="tabular-nums">{p.reviewCount}</span> reviews
            </a>
          )}

          <div className="mt-6">
            <AddToCart productId={p.id} options={p.options} />
          </div>

          <div className="mt-8 flex gap-3 bg-[var(--color-surface-2)] p-5 text-[15px]" data-testid="sourcing">
            <Store className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p className="leading-relaxed">
              {p.sourceCount > 1
                ? `Stocked by ${p.sourceCount} of our partner stores. Hubit ships each size from whichever has it at the best price.`
                : "Sourced from one partner store."}{" "}
              Stock and price checked {timeAgo(p.syncedAt)}, and again before you pay.
            </p>
          </div>

          {p.description && (
            <div className="mt-6">
              <h2 className="text-[17px] font-semibold">About this item</h2>
              <p className="mt-2 max-w-[60ch] whitespace-pre-line leading-relaxed">{p.description}</p>
            </div>
          )}
          {p.styleCode && <p className="mt-4 text-[13px] text-[var(--color-muted)]">Style code <span className="font-medium tabular-nums">{p.styleCode}</span></p>}
        </div>
      </div>

      <PriceHistory readings={readings} currentCents={p.priceCents} />

      <section id="reviews" aria-labelledby="reviews-h" className="mt-24 max-w-3xl">
        <h2 id="reviews-h" className="display text-[clamp(28px,3vw,44px)]">Reviews</h2>
        {p.reviews.length === 0 ? (
          <p className="mt-3">No reviews yet for this item. Reviews here come from the store&rsquo;s own customers.</p>
        ) : (
          <ul className="mt-6 space-y-2">
            {p.reviews.map((r, i) => (
              <li key={i} className="bg-[var(--color-surface-2)] p-5" data-reveal data-testid="review">
                <p className="flex flex-wrap items-center gap-2 text-[15px]">
                  <span className="flex" aria-label={`${r.rating} out of 5`}>
                    {[0, 1, 2, 3, 4].map((s) => (
                      <Star key={s} aria-hidden className={s < r.rating ? "size-3.5 fill-[var(--color-ink)] text-[var(--color-ink)]" : "size-3.5 text-[var(--color-muted)]"} />
                    ))}
                  </span>
                  <span className="font-medium tabular-nums" data-testid="review-rating">{r.rating}/5</span>
                  <span className="font-medium">{r.author}</span>
                  <span className="text-[13px] text-[var(--color-muted)]">{r.date}</span>
                </p>
                <p className="mt-2 leading-relaxed">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
