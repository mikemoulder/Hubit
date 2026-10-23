import type Stripe from "stripe";
import type { Quote } from "../cart/quote.ts";
import { stripe, TEST_CARDS, type TestCard } from "../stripe.ts";

// Takes payment for a re-checked quote by issuing a Stripe invoice and paying it
// at once. The invoice is the order: its lines carry where each item is routed,
// and its PDF is the receipt the shopper keeps.

export type Contact = { email: string; name: string; phone?: string };
export type Address = { line1: string; line2?: string; city: string; postcode: string; state?: string; country: string };

export type PayResult =
  | { ok: true; orderId: string; number: string | null }
  | { ok: false; reason: "declined"; message: string };

const REQUIRED: (keyof Address)[] = ["line1", "city", "postcode", "country"];

/** Field name -> problem, empty when the form is complete. */
export function validateDetails(contact: Partial<Contact>, address: Partial<Address>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!contact.name?.trim()) errors.name = "Enter your full name";
  if (!contact.email?.trim()) errors.email = "Enter your email";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email.trim())) errors.email = "Enter an email like name@example.com";
  for (const f of REQUIRED) if (!address[f]?.toString().trim()) errors[f] = "Required";
  if (address.country && !/^[A-Z]{2}$/.test(address.country)) errors.country = "Choose a country";
  return errors;
}

export async function payForQuote(q: Quote, contact: Contact, address: Address, card: TestCard, by: "human" | "agent"): Promise<PayResult> {
  const s = stripe();
  const customer = await s.customers.create({
    email: contact.email.trim(),
    name: contact.name.trim(),
    phone: contact.phone?.trim() || undefined,
    shipping: {
      name: contact.name.trim(),
      address: { line1: address.line1, line2: address.line2 || undefined, city: address.city, postal_code: address.postcode, state: address.state || undefined, country: address.country },
    },
  });

  const invoice = await s.invoices.create({
    customer: customer.id,
    collection_method: "charge_automatically",
    auto_advance: false,
    currency: "usd",
    pending_invoice_items_behavior: "exclude",
    description: "Hubit order. Items are sourced from independent stores; Hubit is the seller.",
    footer: "Stripe test mode: no real card was charged and nothing ships.",
    metadata: { hubit: "order", placed_by: by, lines: String(q.lines.length) },
  });

  const items: Stripe.InvoiceItemCreateParams[] = q.lines.map((l) => ({
    customer: customer.id,
    invoice: invoice.id,
    currency: "usd",
    amount: l.lineCents,
    description: `${l.title}${l.option !== "One size" ? `, ${l.option}` : ""} × ${l.qty}`,
    metadata: {
      kind: "item",
      productId: l.productId,
      option: l.option,
      qty: String(l.qty),
      unitCents: String(l.unitCents),
      sourceId: l.fulfilledBy?.sourceId ?? "",
      listingId: l.fulfilledBy?.listingId ?? "",
    },
  }));
  items.push({ customer: customer.id, invoice: invoice.id, currency: "usd", amount: q.shippingCents, description: q.shippingCents ? "Shipping" : "Shipping (free from $75)", metadata: { kind: "shipping" } });
  items.push({ customer: customer.id, invoice: invoice.id, currency: "usd", amount: q.serviceFeeCents, description: "Hubit service fee (5%)", metadata: { kind: "service-fee" } });
  // Sequential, so the invoice lists items in cart order.
  for (const item of items) await s.invoiceItems.create(item);

  const final = await s.invoices.finalizeInvoice(invoice.id!);
  if (final.amount_due !== q.totalCents) {
    await s.invoices.voidInvoice(final.id!);
    throw new Error(`Invoice total ${final.amount_due} does not match quote ${q.totalCents}`);
  }

  try {
    const pm = await s.paymentMethods.attach(TEST_CARDS[card].pm, { customer: customer.id });
    const paid = await s.invoices.pay(final.id!, { payment_method: pm.id });
    return { ok: true, orderId: paid.id!, number: paid.number ?? null };
  } catch (e) {
    await s.invoices.voidInvoice(final.id!).catch(() => {});
    const message = e instanceof Error ? e.message : "The payment did not go through.";
    return { ok: false, reason: "declined", message };
  }
}
