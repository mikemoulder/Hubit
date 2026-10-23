import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search, X } from "lucide-react";
import { ProductCard } from "@/components/shop/ProductCard";
import { SortSelect } from "@/components/shop/SortSelect";
import { getCatalog } from "@/server/catalog";
import { parseQuery, summary } from "@/server/catalog/present";
import { search } from "@/server/catalog/search";
import { DEPARTMENTS } from "@/server/catalog/sources";

type Params = Record<string, string | string[] | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const q = parseQuery(await searchParams);
  const dept = DEPARTMENTS.find((d) => d.id === q.department)?.label;
  return { title: q.q ? `“${q.q}”` : (dept ?? "Shop everything") };
}

/** The current URL with some params changed; undefined removes one. Paging resets. */
function hrefWith(params: Params, changes: Record<string, string | undefined>): string {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (typeof v === "string" && v && k !== "page") next.set(k, v);
  for (const [k, v] of Object.entries(changes)) {
    if (v === undefined) next.delete(k);
    else next.set(k, v);
  }
  const s = next.toString();
  return s ? `/shop?${s}` : "/shop";
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const query = parseQuery(params);
  const r = search(getCatalog(), query);
  const pages = Math.max(1, Math.ceil(r.total / r.pageSize));
  const deptLabel = DEPARTMENTS.find((d) => d.id === query.department)?.label;

  const chips: { label: string; href: string }[] = [];
  if (query.q) chips.push({ label: `“${query.q}”`, href: hrefWith(params, { q: undefined }) });
  if (deptLabel) chips.push({ label: deptLabel, href: hrefWith(params, { dept: undefined }) });
  if (query.brand) chips.push({ label: query.brand, href: hrefWith(params, { brand: undefined }) });
  if (query.inStock) chips.push({ label: "In stock", href: hrefWith(params, { stock: undefined }) });
  if (query.minCents !== undefined || query.maxCents !== undefined) {
    const lo = query.minCents !== undefined ? `$${query.minCents / 100}` : "$0";
    const hi = query.maxCents !== undefined ? `$${query.maxCents / 100}` : "any";
    chips.push({ label: `${lo} to ${hi}`, href: hrefWith(params, { min: undefined, max: undefined }) });
  }

  return (
    <main className="mx-auto grid max-w-[1400px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside aria-label="Filters" className="space-y-7 text-sm">
        <FilterGroup title="Department">
          {r.facets.departments.map((f) => (
            <FacetLink key={f.value} on={query.department === f.value} href={hrefWith(params, { dept: query.department === f.value ? undefined : f.value })} label={f.label} count={f.count} />
          ))}
        </FilterGroup>
        <FilterGroup title="Brand">
          {r.facets.brands.slice(0, 12).map((f) => (
            <FacetLink key={f.value} on={query.brand === f.value} href={hrefWith(params, { brand: query.brand === f.value ? undefined : f.value })} label={f.label} count={f.count} />
          ))}
        </FilterGroup>
        <FilterGroup title="Price">
          <form action="/shop" className="flex items-center gap-2">
            {Object.entries(params).map(([k, v]) =>
              typeof v === "string" && !["min", "max", "page"].includes(k) ? <input key={k} type="hidden" name={k} value={v} /> : null,
            )}
            <label className="sr-only" htmlFor="min">Minimum price</label>
            <input id="min" name="min" inputMode="decimal" placeholder="$ min" defaultValue={query.minCents !== undefined ? query.minCents / 100 : ""} className="w-20 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5" />
            <label className="sr-only" htmlFor="max">Maximum price</label>
            <input id="max" name="max" inputMode="decimal" placeholder="$ max" defaultValue={query.maxCents !== undefined ? query.maxCents / 100 : ""} className="w-20 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5" />
            <button type="submit" className="rounded-md border border-[var(--color-border)] px-2 py-1.5 hover:bg-[var(--color-surface-2)]">Go</button>
          </form>
        </FilterGroup>
        <FilterGroup title="Availability">
          <FacetLink on={!!query.inStock} href={hrefWith(params, { stock: query.inStock ? undefined : "1" })} label="In stock only" />
        </FilterGroup>
      </aside>

      <section aria-labelledby="results" className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 id="results" className="text-xl font-semibold tracking-[-0.02em]">
              {query.q ? `Results for “${query.q}”` : (deptLabel ?? "Everything")}
            </h1>
            <p className="mt-0.5 text-sm text-[var(--color-muted)]" data-testid="result-count">
              {r.total.toLocaleString("en-US")} {r.total === 1 ? "product" : "products"}
            </p>
          </div>
          <Suspense>
            <SortSelect value={query.sort ?? "featured"} />
          </Suspense>
        </div>

        {chips.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">
            {chips.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs hover:border-[var(--color-border-strong)]">
                  {c.label} <X className="size-3" aria-hidden />
                  <span className="sr-only">Remove filter</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/shop" className="inline-flex px-2 py-1 text-xs underline underline-offset-4">Clear all</Link>
            </li>
          </ul>
        )}

        {r.total === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-[var(--radius)] border border-dashed border-[var(--color-border-strong)] px-6 py-16 text-center">
            <Search className="size-6 text-[var(--color-muted)]" aria-hidden />
            <p className="mt-3 text-base font-medium">Nothing matches that</p>
            <p className="mt-1 max-w-sm text-sm text-[var(--color-muted)]">Try a broader word, or remove a filter.</p>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
            {r.items.map((p) => (
              <ProductCard key={p.id} product={summary(p)} />
            ))}
          </ul>
        )}

        {pages > 1 && (
          <nav aria-label="Pages" className="mt-10 flex items-center justify-center gap-3 text-sm">
            {r.page > 1 && <Link href={hrefWith(params, { page: String(r.page - 1) })} className="rounded-full border border-[var(--color-border)] px-4 py-1.5 hover:bg-[var(--color-surface-2)]">Previous</Link>}
            <span className="tabular-nums text-[var(--color-muted)]">Page {r.page} of {pages}</span>
            {r.page < pages && <Link href={hrefWith(params, { page: String(r.page + 1) })} className="rounded-full border border-[var(--color-border)] px-4 py-1.5 hover:bg-[var(--color-surface-2)]">Next</Link>}
          </nav>
        )}
      </section>
    </main>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{title}</h2>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function FacetLink({ on, href, label, count }: { on: boolean; href: string; label: string; count?: number }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={on ? "true" : undefined}
        className={`flex items-center justify-between rounded-md px-2 py-1 transition-colors hover:bg-[var(--color-surface-2)] ${on ? "bg-[var(--color-surface-2)] font-medium" : ""}`}
      >
        <span className="truncate">{label}</span>
        {count !== undefined && <span className="ml-2 tabular-nums text-xs text-[var(--color-muted)]">{count}</span>}
      </Link>
    </li>
  );
}
