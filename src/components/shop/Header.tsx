"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

/** A plain bar: wordmark, search, two links. Ground colour, no line beneath it. */
export function Header() {
  const params = useSearchParams();
  const path = usePathname();
  const q = path === "/shop" ? (params.get("q") ?? "") : "";
  const count = useCart().reduce((n, l) => n + l.qty, 0);

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-bg)]">
      <div className="flex h-16 items-center gap-4 px-[var(--margin)] sm:gap-8">
        <Link href="/" className="display shrink-0 text-xl" aria-label="Hubit, home">
          Hubit
        </Link>

        <form action="/shop" role="search" className="relative min-w-0 flex-1 md:max-w-md">
          <label htmlFor="site-search" className="sr-only">
            Search Hubit
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted)]" aria-hidden />
          <input
            key={q}
            id="site-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search products, brands, style codes"
            className="h-10 w-full bg-[var(--color-surface-2)] pl-9 pr-3 text-[15px] placeholder:text-[var(--color-muted)] focus:bg-[var(--color-surface)]"
          />
        </form>

        <nav aria-label="Main" className="ml-auto flex shrink-0 items-center gap-6 text-[15px]">
          <Link href="/shop" className="link-line hidden sm:inline" aria-current={path === "/shop" ? "page" : undefined}>
            Shop
          </Link>
          <Link href="/stores" className="link-line hidden sm:inline" aria-current={path === "/stores" ? "page" : undefined}>
            Stores
          </Link>
          <Link href="/cart" data-testid="cart-link" className="btn min-h-10 px-4">
            <ShoppingBag className="size-4" aria-hidden />
            <span className="tabular-nums" data-testid="cart-count">
              {count}
            </span>
            <span className="sr-only">items in your cart</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
