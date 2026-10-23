"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { MAX_QTY, removeLine, setQty, useCart } from "@/lib/cart";
import { money, sized } from "@/lib/format";
import type { Quote } from "@/server/cart/quote";

const PROBLEM: Record<string, string> = {
  "not-found": "This item is no longer listed.",
  "unknown-option": "This option is no longer offered.",
  "sold-out": "Sold out at every store we source from. Remove it to continue.",
};

const FREE_SHIPPING_FROM = 7500;

export function CartView() {
  const lines = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [failed, setFailed] = useState(false);

  // Every change is re-priced by the server; the browser never computes money.
  useEffect(() => {
    if (lines.length === 0) return;
    const ctrl = new AbortController();
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: lines.map(({ productId, option, qty }) => ({ productId, option, qty })) }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((q: Quote) => {
        setQuote(q);
        setFailed(false);
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setFailed(true);
      });
    return () => ctrl.abort();
  }, [lines]);

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-[var(--radius)] border border-dashed border-[var(--color-border-strong)] px-6 py-16 text-center" data-testid="cart-empty">
        <ShoppingBag className="size-6 text-[var(--color-muted)]" aria-hidden />
        <p className="mt-3 text-base font-medium">Your cart is empty</p>
        <Link href="/shop" className="mt-4 rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-[var(--color-ink-fg)]">
          Start shopping
        </Link>
      </div>
    );
  }

  if (failed) return <p className="text-sm text-[var(--color-danger)]">Could not price your cart. Refresh to try again.</p>;
  if (!quote) return <p className="text-sm text-[var(--color-muted)]" aria-busy>Pricing your cart…</p>;

  const toFree = FREE_SHIPPING_FROM - quote.subtotalCents;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
      <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]" data-testid="cart-lines">
        {quote.lines.map((l) => {
          const local = lines.find((x) => x.productId === l.productId && x.option === l.option);
          return (
            <li key={`${l.productId}|${l.option}`} className="flex gap-4 py-4" data-testid="cart-line" data-product-id={l.productId}>
              <Link href={`/p/${l.productId}`} className="shrink-0">
                {l.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sized(l.image, 200)} alt="" className="size-20 rounded-md border border-[var(--color-border)] object-cover" />
                ) : (
                  <div className="size-20 rounded-md bg-[var(--color-surface-2)]" />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--color-muted)]">{l.brand}</p>
                <Link href={`/p/${l.productId}`} className="line-clamp-2 text-sm font-medium hover:underline">{l.title}</Link>
                {l.option !== "One size" && <p className="mt-0.5 text-xs text-[var(--color-muted)]">Option: {l.option}</p>}
                {local?.by === "agent" && <p className="mt-1 inline-block rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-accent)]">Added by your agent</p>}
                {l.problem && <p className="mt-1 text-xs text-[var(--color-danger)]" data-testid="line-problem">{PROBLEM[l.problem]}</p>}
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-[var(--color-border)]">
                    <button type="button" aria-label="Decrease quantity" onClick={() => setQty(l.productId, l.option, l.qty - 1)} className="p-1.5 hover:bg-[var(--color-surface-2)] rounded-l-full">
                      <Minus className="size-3.5" aria-hidden />
                    </button>
                    <span className="w-7 text-center text-sm tabular-nums" data-testid="line-qty">{l.qty}</span>
                    <button type="button" aria-label="Increase quantity" disabled={l.qty >= MAX_QTY} onClick={() => setQty(l.productId, l.option, l.qty + 1)} className="p-1.5 hover:bg-[var(--color-surface-2)] rounded-r-full disabled:opacity-40">
                      <Plus className="size-3.5" aria-hidden />
                    </button>
                  </div>
                  <button type="button" onClick={() => removeLine(l.productId, l.option)} className="flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-fg)]">
                    <Trash2 className="size-3.5" aria-hidden /> Remove
                  </button>
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums" data-testid="line-total">{l.problem ? "—" : money(l.lineCents)}</p>
            </li>
          );
        })}
      </ul>

      <aside aria-labelledby="summary-h" className="h-fit rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 id="summary-h" className="text-base font-semibold">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm" data-testid="totals">
          <Row label={`Items (${quote.itemCount})`} value={money(quote.subtotalCents)} testid="subtotal" />
          <Row label="Shipping" value={quote.shippingCents === 0 ? "Free" : money(quote.shippingCents)} testid="shipping" />
          <Row label="Service fee (5%)" value={money(quote.serviceFeeCents)} testid="service-fee" />
          <div className="border-t border-[var(--color-border)] pt-2">
            <Row label="Total" value={money(quote.totalCents)} strong testid="total" />
          </div>
        </dl>
        {toFree > 0 && quote.subtotalCents > 0 && (
          <p className="mt-3 text-xs text-[var(--color-muted)]" data-testid="free-shipping-hint">
            Add {money(toFree)} more for free shipping.
          </p>
        )}
        <button
          type="button"
          disabled
          className="mt-5 w-full rounded-full bg-[var(--color-ink)] px-5 py-3 text-sm font-medium text-[var(--color-ink-fg)] disabled:cursor-not-allowed disabled:opacity-40"
          data-testid="checkout"
        >
          {quote.purchasable ? "Checkout (coming next)" : "Fix the items above to check out"}
        </button>
      </aside>
    </div>
  );
}

function Row({ label, value, strong, testid }: { label: string; value: string; strong?: boolean; testid: string }) {
  return (
    <div className={`flex justify-between ${strong ? "text-base font-semibold" : ""}`}>
      <dt className={strong ? "" : "text-[var(--color-muted)]"}>{label}</dt>
      <dd className="tabular-nums" data-testid={testid}>{value}</dd>
    </div>
  );
}
