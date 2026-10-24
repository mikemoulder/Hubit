"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, RefreshCw } from "lucide-react";
import { clearCart, removeLine, useCart } from "@/lib/cart";
import { money, sized } from "@/lib/format";
import type { Quote } from "@/server/cart/quote";
import type { Change } from "@/server/checkout/recheck";

type Review = { quote: Quote; changes: Change[]; checkedAt: string; mode: "live" | "snapshot" };
type Card = "visa" | "declined" | "no-funds";

const CARDS: { id: Card; label: string; note: string }[] = [
  { id: "visa", label: "Visa ending 4242", note: "Pays" },
  { id: "declined", label: "Card that is declined", note: "Stripe refuses it" },
  { id: "no-funds", label: "Card with insufficient funds", note: "Stripe refuses it" },
];

const COUNTRIES: [string, string][] = [
  ["US", "United States"], ["GB", "United Kingdom"], ["CA", "Canada"], ["NG", "Nigeria"], ["DE", "Germany"],
  ["FR", "France"], ["NL", "Netherlands"], ["IE", "Ireland"], ["AU", "Australia"], ["ZA", "South Africa"],
];

const EMPTY = { name: "", email: "", phone: "", line1: "", line2: "", city: "", state: "", postcode: "", country: "US" };

export function CheckoutView() {
  const lines = useCart();
  const router = useRouter();
  const [review, setReview] = useState<Review | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [card, setCard] = useState<Card>("visa");
  const [paying, setPaying] = useState(false);
  const [declined, setDeclined] = useState<string | null>(null);

  const body = useCallback(() => lines.map(({ productId, option, qty }) => ({ productId, option, qty })), [lines]);

  // Every time the cart changes, the stores are asked again.
  useEffect(() => {
    if (lines.length === 0) return;
    const ctrl = new AbortController();
    fetch("/api/checkout/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines: body() }), signal: ctrl.signal })
      .then((r) => r.json())
      .then(setReview)
      .catch(() => {});
    return () => ctrl.abort();
  }, [lines, body]);

  if (lines.length === 0 && !paying) {
    return (
      <div className="bg-[var(--color-surface-2)] px-6 py-20 text-center" data-testid="checkout-empty">
        <p className="text-[17px] font-medium">There is nothing to check out</p>
        <Link href="/shop" className="btn mt-6">Start shopping</Link>
      </div>
    );
  }

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: "" }));
  };

  async function pay() {
    if (!review) return;
    setPaying(true);
    setDeclined(null);
    setNotice(null);
    const res = await fetch("/api/checkout/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: body(),
        contact: { name: form.name, email: form.email, phone: form.phone },
        address: { line1: form.line1, line2: form.line2, city: form.city, state: form.state, postcode: form.postcode, country: form.country },
        card,
        expectedTotalCents: review.quote.totalCents,
        by: lines.some((l) => l.by === "agent") ? "agent" : "human",
      }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) {
      clearCart();
      router.push(`/orders/${data.orderId}`);
      return;
    }
    setPaying(false);
    if (data.reason === "invalid") setErrors(data.errors ?? {});
    else if (data.reason === "declined") setDeclined(data.message);
    else if (data.reason === "changed" || data.reason === "unavailable") {
      setReview(data.review);
      setNotice("Something changed at a store since you looked. Nothing was charged; check the new total and pay again.");
    } else setDeclined("The payment could not be started. Nothing was charged; try again.");
  }

  const q = review?.quote;
  const blocked = !q || !q.purchasable;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
      <form
        className="space-y-12"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          pay();
        }}
        id="checkout-form"
      >
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-4 text-[20px] font-semibold">Contact</legend>
          <Field label="Full name" name="name" value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" />
          <Field label="Email" name="email" type="email" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
          <Field label="Phone (optional)" name="phone" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" />
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-4 text-[20px] font-semibold">Delivery address</legend>
          <div className="sm:col-span-2">
            <Field label="Address" name="line1" value={form.line1} onChange={set("line1")} error={errors.line1} autoComplete="address-line1" />
          </div>
          <div className="sm:col-span-2">
            <Field label="Flat, unit, building (optional)" name="line2" value={form.line2} onChange={set("line2")} autoComplete="address-line2" />
          </div>
          <Field label="City" name="city" value={form.city} onChange={set("city")} error={errors.city} autoComplete="address-level2" />
          <Field label="State or region (optional)" name="state" value={form.state} onChange={set("state")} autoComplete="address-level1" />
          <Field label="Postcode" name="postcode" value={form.postcode} onChange={set("postcode")} error={errors.postcode} autoComplete="postal-code" />
          <label className="block">
            <span className="text-[15px] font-medium">Country</span>
            <select name="country" value={form.country} onChange={set("country")} autoComplete="country" className="mt-1.5 h-12 w-full bg-[var(--color-surface)] px-3">
              {COUNTRIES.map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend className="text-[20px] font-semibold">Payment</legend>
          <p className="mt-2 max-w-[60ch]">
            Hubit runs in Stripe test mode, so you choose what the card does. The charge, the decline and the invoice are all real Stripe
            test objects.
          </p>
          <div className="mt-4 grid gap-2" role="radiogroup" aria-label="Test card">
            {CARDS.map((c) => (
              <label key={c.id} className={`flex cursor-pointer items-center justify-between gap-4 px-4 py-3.5 transition-colors ${card === c.id ? "bg-[var(--color-ink)] text-[var(--color-ink-fg)]" : "bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]"}`}>
                <span className="flex items-center gap-3">
                  <input type="radio" name="card" value={c.id} checked={card === c.id} onChange={() => setCard(c.id)} className="accent-current" />
                  {c.label}
                </span>
                <span className="text-[13px] opacity-80">{c.note}</span>
              </label>
            ))}
          </div>
          {declined && (
            <p role="alert" className="mt-4 flex gap-2 bg-[var(--color-danger-soft)] px-4 py-3 font-medium text-[var(--color-danger)]" data-testid="payment-declined">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {declined} Nothing was charged.
            </p>
          )}
        </fieldset>
      </form>

      <aside aria-labelledby="review-h" className="h-fit bg-[var(--color-ink)] p-6 text-[var(--color-ink-fg)] lg:sticky lg:top-24">
        <h2 id="review-h" className="text-[20px] font-semibold">Your order</h2>
        {!review ? (
          <p className="mt-4 flex items-center gap-2" aria-busy>
            <RefreshCw className="size-4 animate-spin" aria-hidden /> Checking prices and stock with the stores…
          </p>
        ) : (
          <>
            <p className="mt-2 flex items-center gap-2 text-[13px]" data-testid="recheck-status">
              <Check className="size-4" aria-hidden /> Prices and stock checked with the stores just now.
            </p>
            {notice && <p role="alert" className="mt-4 bg-[var(--color-ink-fg)] px-3 py-2.5 text-[15px] text-[var(--color-ink)]" data-testid="checkout-notice">{notice}</p>}
            {review.changes.length > 0 && (
              <ul className="mt-4 space-y-2" data-testid="changes">
                {review.changes.map((c) => (
                  <li key={`${c.productId}|${c.option}`} className="bg-[var(--color-ink-fg)] px-3 py-2.5 text-[15px] text-[var(--color-ink)]" data-testid="change">
                    {c.kind === "sold-out" ? (
                      <>
                        <strong>{c.title}</strong> has sold out at every store we source from.{" "}
                        <button type="button" className="link-line font-medium underline" onClick={() => removeLine(c.productId, c.option)}>
                          Remove it
                        </button>
                      </>
                    ) : (
                      <>
                        <strong>{c.title}</strong> {c.kind === "price-up" ? "went up" : "went down"} from {money(c.fromCents)} to {money(c.toCents)} since you added it.
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <ul className="mt-5 space-y-3">
              {review.quote.lines.filter((l) => !l.problem).map((l) => (
                <li key={`${l.productId}|${l.option}`} className="flex gap-3 text-[15px]" data-testid="review-line">
                  {l.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sized(l.image, 120)} alt="" className="size-14 shrink-0 bg-[#f6f6f6] object-cover" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2">{l.title}</span>
                    <span className="text-[13px] opacity-80">{l.option !== "One size" ? `${l.option} · ` : ""}Qty {l.qty}</span>
                  </span>
                  <span className="tabular-nums">{money(l.lineCents)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-6 space-y-2.5 text-[15px]">
              <Row label="Items" value={money(review.quote.subtotalCents)} testid="review-subtotal" />
              <Row label="Shipping" value={review.quote.shippingCents ? money(review.quote.shippingCents) : "Free"} testid="review-shipping" />
              <Row label="Service fee (5%)" value={money(review.quote.serviceFeeCents)} testid="review-fee" />
              <div className="pt-3 text-[20px] font-semibold">
                <Row label="Total" value={money(review.quote.totalCents)} testid="review-total" />
              </div>
            </dl>
          </>
        )}
        <button type="submit" form="checkout-form" disabled={blocked || paying} className="btn btn-invert mt-6 w-full" data-testid="pay">
          {paying ? "Paying…" : q && q.purchasable ? `Pay ${money(q.totalCents)}` : "Remove sold-out items to pay"}
        </button>
      </aside>
    </div>
  );
}

function Field({ label, error, ...input }: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `f-${input.name}`;
  return (
    <label className="block" htmlFor={id}>
      <span className="text-[15px] font-medium">{label}</span>
      <input
        id={id}
        {...input}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`mt-1.5 h-12 w-full bg-[var(--color-surface)] px-3 ${error ? "outline-2 outline-[var(--color-danger)]" : ""}`}
      />
      {error && (
        <span id={`${id}-err`} className="mt-1 block text-[13px] font-medium text-[var(--color-danger)]" data-testid={`error-${input.name}`}>
          {error}
        </span>
      )}
    </label>
  );
}

function Row({ label, value, testid }: { label: string; value: string; testid: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd className="tabular-nums" data-testid={testid}>{value}</dd>
    </div>
  );
}
