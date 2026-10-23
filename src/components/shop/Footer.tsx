import Link from "next/link";
import { DEPARTMENTS } from "@/server/catalog/sources";

export function Footer({ storeCount, takenAt }: { storeCount: number; takenAt: string }) {
  return (
    <footer className="mt-16 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.5fr_1fr_1.3fr]">
        <div>
          <p className="text-base font-semibold tracking-[-0.02em]">Hubit</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-muted)]">
            One shop over {storeCount} independent stores. You buy from Hubit, in one cart and one
            payment; Hubit sources each item from the store that has it in stock at the best price.
            You and your AI agent shop the same page.
          </p>
        </div>
        <nav aria-label="Shop by department">
          <h2 className="text-sm font-semibold">Shop</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
            {DEPARTMENTS.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/shop?dept=${d.id}`}
                  className="text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)] hover:underline"
                >
                  {d.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="text-sm font-semibold">Fees, plainly</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
            Every item is priced at its store&rsquo;s own price. Hubit adds a 5% service fee and
            $6.99 shipping, free on orders of $75 or more. Both are shown before you pay.
          </p>
        </div>
      </div>
      <div className="border-t border-[var(--color-border)]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-[var(--color-muted)] sm:px-6">
          <p>Payments run in Stripe test mode. Nothing ships and no real card is charged.</p>
          <p>Catalogue snapshot taken {new Date(takenAt).toUTCString().slice(5, 16)}.</p>
        </div>
      </div>
    </footer>
  );
}
