import type { Metadata } from "next";
import { CheckoutView } from "./CheckoutView";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <main className="px-[var(--margin)] pb-10 pt-6">
      <h1 className="display mb-8 text-[clamp(28px,3vw,44px)]">Checkout</h1>
      <CheckoutView />
    </main>
  );
}
