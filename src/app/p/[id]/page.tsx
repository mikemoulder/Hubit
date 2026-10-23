import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Store } from "lucide-react";
import { AddToCart } from "@/components/shop/AddToCart";
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
  const dept = DEPARTMENTS.find((d) => d.id === p.department)!;

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-[var(--color-muted)]">
        <Link href="/shop" className="hover:underline">Shop</Link> /{" "}
        <Link href={`/shop?dept=${dept.id}`} className="hover:underline">{dept.label}</Link> /{" "}
        <Link href={`/shop?brand=${encodeURIComponent(p.brand)}`} className="hover:underline">{p.brand}</Link>
      </nav>

      <div className="mt-4 grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-12">
        <div className="grid grid-cols-2 gap-2">
          {p.images.slice(0, 3).map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={sized(src, i === 0 ? 1000 : 500)}
              alt={i === 0 ? p.title : ""}
              className={`w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)] object-cover ${i === 0 ? "col-span-2 aspect-square" : "aspect-square"}`}
            />
          ))}
        </div>

        <div className="md:pt-2">
          <p className="text-sm text-[var(--color-muted)]">{p.brand}</p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight tracking-[-0.02em]" data-testid="product-name">
            {p.title}
          </h1>
          <p className="mt-3 flex items-baseline gap-3">
            <span className="text-xl font-semibold tabular-nums" data-testid="price">
              {money(p.priceCents)}
            </span>
            {p.compareAtCents && <s className="text-sm text-[var(--color-muted)] tabular-nums">{money(p.compareAtCents)}</s>}
          </p>
          {p.rating !== null && (
            <a href="#reviews" className="mt-2 flex items-center gap-1 text-sm text-[var(--color-muted)] hover:underline">
              <Star className="size-4 fill-[var(--color-sale)] text-[var(--color-sale)]" aria-hidden />
              <span className="tabular-nums">{p.rating.toFixed(1)}</span> from <span className="tabular-nums">{p.reviewCount}</span> reviews
            </a>
          )}

          <div className="mt-6">
            <AddToCart productId={p.id} options={p.options} />
          </div>

          <div className="mt-6 flex gap-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm" data-testid="sourcing">
            <Store className="mt-0.5 size-4 shrink-0 text-[var(--color-muted)]" aria-hidden />
            <p className="leading-relaxed text-[var(--color-muted)]">
              {p.sourceCount > 1
                ? `Stocked by ${p.sourceCount} of our partner stores. Hubit ships each size from whichever has it at the best price.`
                : "Sourced from one partner store."}{" "}
              Stock and price checked {timeAgo(p.syncedAt)}, and again before you pay.
            </p>
          </div>

          {p.description && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold">About this item</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--color-muted)]">{p.description}</p>
            </div>
          )}
          {p.styleCode && <p className="mt-4 text-xs text-[var(--color-muted)]">Style code <span className="font-mono">{p.styleCode}</span></p>}
        </div>
      </div>

      <section id="reviews" aria-labelledby="reviews-h" className="mt-14 max-w-3xl">
        <h2 id="reviews-h" className="text-lg font-semibold tracking-[-0.02em]">Reviews</h2>
        {p.reviews.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-muted)]">No reviews yet for this item.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--color-border)]">
            {p.reviews.map((r, i) => (
              <li key={i} className="py-4" data-testid="review">
                <p className="flex items-center gap-2 text-sm">
                  <span className="flex" aria-label={`${r.rating} out of 5`}>
                    {[0, 1, 2, 3, 4].map((s) => (
                      <Star key={s} aria-hidden className={s < r.rating ? "size-3.5 fill-[var(--color-sale)] text-[var(--color-sale)]" : "size-3.5 text-[var(--color-border-strong)]"} />
                    ))}
                  </span>
                  <span className="font-medium">{r.author}</span>
                  <span className="text-xs text-[var(--color-muted)]">{r.date}</span>
                </p>
                <p className="mt-1.5 text-sm leading-relaxed">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
