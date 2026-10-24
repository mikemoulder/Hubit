// Hubit sells every item at its source price. Hubit's margin is two fees, charged
// once per order and shown as their own lines on the cart, the order and the invoice.

export const FEES = {
  /** Flat shipping per order, waived at or above the threshold. */
  shippingCents: 699,
  freeShippingFromCents: 7500,
  /** Service fee in basis points of the items subtotal (500 = 5%). */
  serviceFeeBps: 500,
} as const;

export type Totals = {
  subtotalCents: number;
  shippingCents: number;
  serviceFeeCents: number;
  totalCents: number;
};

export function totalsFor(subtotalCents: number): Totals {
  if (subtotalCents <= 0) return { subtotalCents: 0, shippingCents: 0, serviceFeeCents: 0, totalCents: 0 };
  const shippingCents = subtotalCents >= FEES.freeShippingFromCents ? 0 : FEES.shippingCents;
  // Half-up on whole cents, in integers: 5% of $10.10 is 50.5c -> 51c.
  const serviceFeeCents = Math.floor((subtotalCents * FEES.serviceFeeBps + 5000) / 10000);
  return { subtotalCents, shippingCents, serviceFeeCents, totalCents: subtotalCents + shippingCents + serviceFeeCents };
}
