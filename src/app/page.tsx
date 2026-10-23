import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/shop/ProductCard";
import { sized } from "@/lib/format";
import { getCatalog } from "@/server/catalog";
import { summary } from "@/server/catalog/present";
import { search } from "@/server/catalog/search";
import { DEPARTMENTS } from "@/server/catalog/sources";

export default function Home() {
  const catalog = getCatalog();
  const multi = catalog.products.filter((p) => p.offers.length > 1 && p.available).slice(0, 8);
  const rated = search(catalog, { sort: "rating", inStock: true, pageSize: 8 }).items;
  const depts = DEPARTMENTS.map((d) => {
    const r = search(catalog, { department: d.id, inStock: true, pageSize: 1 });
    return { ...d, count: r.total, image: r.items[0]?.images[0] };
  });

  return (
    <main className="mx-auto max-w-[1400px] px-4 sm:px-6">
      <section className="py-10 sm:py-14">
        <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
          {catalog.sources.length} stores. One cart. One payment.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-muted)] sm:text-lg">
          Hubit stocks {catalog.products.length.toLocaleString("en-US")} products from independent
          shops. You buy from Hubit; we source each item from the store that has your size in stock
          at the best price. Your AI agent shops the same page with you, through tools instead of
          scraping.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-[var(--color-ink-fg)] transition-opacity hover:opacity-90"
          >
            Browse everything <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section aria-labelledby="depts">
        <h2 id="depts" className="text-lg font-semibold tracking-[-0.02em]">
          Departments
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {depts.map((d) => (
            <li key={d.id}>
              <Link
                href={`/shop?dept=${d.id}`}
                className="group relative flex aspect-[4/3] items-end overflow-hidden rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface-2)]"
              >
                {d.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sized(d.image, 500)}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                )}
                <span className="relative m-2 rounded-full bg-[var(--color-surface)] px-3 py-1 text-sm font-medium">
                  {d.label} <span className="tabular-nums text-[var(--color-muted)]">{d.count}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Shelf
        id="multi"
        title="Stocked by several stores"
        note="Hubit routes each size to whichever store has it, so these rarely sell out."
        href="/shop?q=jordan"
        items={multi.map(summary)}
      />
      <Shelf id="rated" title="Best reviewed" note="Ratings come from the stores' own customer reviews." href="/shop?sort=rating" items={rated.map(summary)} />
    </main>
  );
}

function Shelf({ id, title, note, href, items }: { id: string; title: string; note: string; href: string; items: ReturnType<typeof summary>[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={id} className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id={id} className="text-lg font-semibold tracking-[-0.02em]">
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-[var(--color-muted)]">{note}</p>
        </div>
        <Link href={href} className="text-sm font-medium underline underline-offset-4 hover:opacity-70">
          See more
        </Link>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </ul>
    </section>
  );
}
