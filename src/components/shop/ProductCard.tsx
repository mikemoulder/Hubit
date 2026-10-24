import Link from "next/link";
import { Star } from "lucide-react";
import { money, sized } from "@/lib/format";
import type { ProductSummary } from "@/server/catalog/present";

export function ProductCard({ product: p }: { product: ProductSummary }) {
  return (
    <li className="group flex flex-col" data-shutter data-testid="product-card" data-product-id={p.id}>
      <Link href={`/p/${p.id}`} className="flex flex-col">
        <div className="shutter relative aspect-[4/5] overflow-hidden bg-[#f6f6f6]">
          {p.image && (
            // Source images come from 28 CDNs; Shopify's resizes on request (see sized()).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sized(p.image, 600)}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          )}
          {!p.available && (
            <span className="absolute left-0 top-0 bg-[var(--color-ink)] px-2.5 py-1 text-[13px] text-[var(--color-ink-fg)]">
              Sold out
            </span>
          )}
          {p.available && p.compareAtCents && (
            <span className="absolute left-0 top-0 bg-[var(--color-sale)] px-2.5 py-1 text-[13px] text-white">
              Sale
            </span>
          )}
        </div>
        <p className="mt-3 text-[13px] text-[var(--color-muted)]">{p.brand}</p>
        <h3 className="mt-0.5 line-clamp-2 text-[15px] font-medium leading-snug underline-offset-4 group-hover:underline" data-testid="product-title">
          {p.title}
        </h3>
        <p className="mt-1 flex items-baseline gap-2 text-[15px]">
          <span className="font-semibold tabular-nums" data-testid="product-price">
            {money(p.priceCents)}
          </span>
          {p.compareAtCents && (
            <s className="text-[13px] text-[var(--color-muted)] tabular-nums">{money(p.compareAtCents)}</s>
          )}
        </p>
        {p.rating !== null && (
          <p className="mt-1 flex items-center gap-1 text-[13px] text-[var(--color-muted)]">
            <Star className="size-3 fill-[var(--color-ink)] text-[var(--color-ink)]" aria-hidden />
            <span className="tabular-nums">{p.rating.toFixed(1)}</span>
            <span className="tabular-nums">({p.reviewCount})</span>
          </p>
        )}
      </Link>
    </li>
  );
}
