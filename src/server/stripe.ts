import Stripe from "stripe";

// One Stripe client for the server. Hubit runs on test keys only: the payment
// endpoint refuses to charge with a live key, so no real card can ever be taken.
let client: Stripe | null = null;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!key.startsWith("sk_test_")) throw new Error("Hubit only runs on Stripe test keys");
  client ??= new Stripe(key);
  return client;
}

/** Stripe's own test payment methods, by what they do. */
export const TEST_CARDS = {
  visa: { pm: "pm_card_visa", label: "Visa ending 4242, pays" },
  declined: { pm: "pm_card_chargeCustomerFail", label: "Card that is declined" },
  "no-funds": { pm: "pm_card_visa_chargeDeclinedInsufficientFunds", label: "Card with insufficient funds" },
} as const;

export type TestCard = keyof typeof TEST_CARDS;
