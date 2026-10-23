import type { Metadata } from "next";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <main className="px-[var(--margin)] pb-10 pt-6">
      <h1 className="display mb-8 text-[clamp(28px,3vw,44px)]">Your cart</h1>
      <CartView />
    </main>
  );
}
