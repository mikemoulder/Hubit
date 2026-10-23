import type { Metadata } from "next";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <main className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-[-0.02em]">Your cart</h1>
      <CartView />
    </main>
  );
}
