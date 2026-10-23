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
      <div className="flex flex-col items-center bg-[var(--color-surface-2)] px-6 py-20 text-center" data-testid="cart-empty">
        <ShoppingBag className="size-6" aria-hidden />
        <p className="mt-3 text-[17px] font-medium">Your cart is empty</p>
        <p className="mt-1 max-w-sm">Everything from 28 stores goes in this one cart, and is paid for once.</p>
        <Link href="/shop" className="btn mt-6">
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
      <ul className="space-y-2" data-testid="cart-lines">
        {quote.lines.map((l) => {
          const local = lines.find((x) => x.productId === l.productId && x.option === l.option);
          return (
            <li key={`${l.productId}|${l.option}`} className="flex gap-4 bg-[var(--color-surface)] p-4" data-testid="cart-line" data-product-id={l.productId}>
              <Link href={`/p/${l.productId}`} className="shrink-0">
                {l.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sized(l.image, 240)} alt="" className="size-24 bg-[#f6f6f6] object-cover" />
                ) : (
                  <div className="size-24 bg-[var(--color-surface-2)]" />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-[var(--color-muted)]">{l.brand}</p>
                <Link href={`/p/${l.productId}`} className="link-line line-clamp-2 text-[15px] font-medium">{l.title}</Link>
                {l.option !== "One size" && <p className="mt-0.5 text-[13px] text-[var(--color-muted)]">Option: {l.option}</p>}
                {local?.by === "agent" && <p className="mt-1 inline-block bg-[var(--color-ink)] px-2 py-0.5 text-[13px] text-[var(--color-ink-fg)]" data-testid="agent-tag">Added by your agent</p>}
                {l.problem && <p className="mt-1 text-[13px] font-medium text-[var(--color-danger)]" data-testid="line-problem">{PROBLEM[l.problem]}</p>}
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center bg-[var(--color-surface-2)]">
                    <button type="button" aria-label="Decrease quantity" onClick={() => setQty(l.productId, l.option, l.qty - 1)} className="grid size-9 place-items-center transition-colors hover:bg-[var(--color-surface-3)] active:scale-95">
                      <Minus className="size-3.5" aria-hidden />
                    </button>
                    <span className="w-8 text-center text-[15px] tabular-nums" data-testid="line-qty">{l.qty}</span>
                    <button type="button" aria-label="Increase quantity" disabled={l.qty >= MAX_QTY} onClick={() => setQty(l.productId, l.option, l.qty + 1)} className="grid size-9 place-items-center transition-colors hover:bg-[var(--color-surface-3)] active:scale-95 disabled:opacity-40">
                      <Plus className="size-3.5" aria-hidden />
                    </button>
                  </div>
                  <button type="button" onClick={() => removeLine(l.productId, l.option)} className="link-line flex items-center gap-1 text-[13px]">
                    <Trash2 className="size-3.5" aria-hidden /> Remove
                  </button>
                </div>
              </div>
              <p className="shrink-0 text-[15px] font-semibold tabular-nums" data-testid="line-total">{l.problem ? "—" : money(l.lineCents)}</p>
            </li>
          );
        })}
      </ul>

      <aside aria-labelledby="summary-h" className="h-fit bg-[var(--color-ink)] p-6 text-[var(--color-ink-fg)] lg:sticky lg:top-24">
        <h2 id="summary-h" className="text-[17px] font-semibold">Order summary</h2>
        <dl className="mt-5 space-y-2.5 text-[15px]" data-testid="totals">
          <Row label={`Items (${quote.itemCount})`} value={money(quote.subtotalCents)} testid="subtotal" />
          <Row label="Shipping" value={quote.shippingCents === 0 ? "Free" : money(quote.shippingCents)} testid="shipping" />
          <Row label="Service fee (5%)" value={money(quote.serviceFeeCents)} testid="service-fee" />
          <div className="pt-3">
            <Row label="Total" value={money(quote.totalCents)} strong testid="total" />
          </div>
        </dl>
        {toFree > 0 && quote.subtotalCents > 0 && (
          <p className="mt-4 text-[13px]" data-testid="free-shipping-hint">
            Add {money(toFree)} more for free shipping.
          </p>
        )}
        {quote.purchasable ? (
          <Link href="/checkout" className="btn btn-invert mt-6 w-full" data-testid="checkout">
            Checkout
          </Link>
        ) : (
          <button type="button" disabled className="btn btn-invert mt-6 w-full" data-testid="checkout">
            Fix the items above
          </button>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value, strong, testid }: { label: string; value: string; strong?: boolean; testid: string }) {
  return (
    <div className={`flex justify-between ${strong ? "text-[20px] font-semibold" : ""}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums" data-testid={testid}>{value}</dd>
    </div>
  );
}
