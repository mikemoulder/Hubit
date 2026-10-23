"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { DEPARTMENTS } from "@/server/catalog/sources";

/**
 * Store chrome. Ink only: the accent colour belongs to the agent layer and loses
 * its meaning the moment it decorates a nav bar.
 */
export function Header() {
  const params = useSearchParams();
  const dept = params.get("dept");
  const q = params.get("q") ?? "";
  const count = useCart().reduce((n, l) => n + l.qty, 0);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 sm:gap-6 sm:px-6">
        <Link href="/" className="shrink-0 text-lg font-semibold tracking-[-0.02em]">
          Hubit
        </Link>

        <form action="/shop" role="search" className="relative min-w-0 flex-1 md:max-w-md">
          <label htmlFor="site-search" className="sr-only">
            Search Hubit
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]"
            aria-hidden
          />
          {/* Keyed on the URL's query so it follows back/forward navigation. */}
          <input
            key={q}
            id="site-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search 1,700 products from 28 stores"
            className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] py-2 pl-9 pr-3 text-sm transition-colors placeholder:text-[var(--color-muted)] hover:border-[var(--color-border-strong)] focus:bg-[var(--color-surface)]"
          />
        </form>

        <Link
          href="/cart"
          data-testid="cart-link"
          className="ml-auto flex shrink-0 items-center gap-2 rounded-full bg-[var(--color-ink)] px-3.5 py-2 text-sm font-medium text-[var(--color-ink-fg)] transition-opacity hover:opacity-90"
        >
          <ShoppingBag className="size-4" aria-hidden />
          <span className="tabular-nums" data-testid="cart-count">
            {count}
          </span>
          <span className="sr-only">items in your cart</span>
        </Link>
      </div>

      <nav aria-label="Departments">
        <ul className="thin-scroll mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4 pb-2.5 sm:px-6">
          <li>
            <DeptLink href="/shop" on={!dept && !q}>
              All
            </DeptLink>
          </li>
          {DEPARTMENTS.map((d) => (
            <li key={d.id}>
              <DeptLink href={`/shop?dept=${d.id}`} on={dept === d.id}>
                {d.label}
              </DeptLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

function DeptLink({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={[
        "block whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors",
        on
          ? "bg-[var(--color-surface-2)] font-medium text-[var(--color-fg)]"
          : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
