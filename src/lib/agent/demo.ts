"use client";

import { useSyncExternalStore } from "react";
import { money } from "@/lib/format";
import { readCart, describeCart } from "./tools";
import { getHost } from "./webmcp";

// The demo agent: four fixed scripts of real tool calls, for browsers with no AI
// agent attached (which is every browser a test runner uses). Each call goes
// through the same registry a WebMCP agent reaches, and is logged as it happens.

export type Call = { tool: string; input: Record<string, unknown>; result: string; refused: boolean };
export type Run = { task: string; calls: Call[]; reply: string | null; busy: boolean };

let run: Run | null = null;
const listeners = new Set<() => void>();
const set = (next: Run) => {
  run = next;
  listeners.forEach((l) => l());
};

export function useRun(): Run | null {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => run,
    () => null,
  );
}

async function call(tool: string, input: Record<string, unknown> = {}): Promise<Call> {
  const r = await getHost().call(tool, input);
  const c: Call = { tool, input, result: r.content.map((x) => x.text).join(" "), refused: !!r.isError };
  set({ ...run!, calls: [...run!.calls, c] });
  return c;
}

type Task = { label: string; script: () => Promise<string> };

export const TASKS: Task[] = [
  {
    label: "Find the Air Jordan 5 in size 9 and add it",
    async script() {
      await call("search_catalog", { q: "jordan 5" });
      await call("get_product", { id: "hq7978-001" });
      const added = await call("add_to_cart", { productId: "hq7978-001", option: "9", qty: 1 });
      if (added.refused) return `I couldn't add it: ${added.result}`;
      await call("view_cart");
      const q = await readCart();
      return `Added Air Jordan 5 Retro Mens Shoes, size 9. Your cart total is ${money(q.totalCents)}.`;
    },
  },
  {
    label: "Add two of the cheapest wide-mouth bottles",
    async script() {
      await call("search_catalog", { q: "wide mouth bottle", sort: "price-asc", inStock: true });
      const added = await call("add_to_cart", { productId: "nalgene-1030", option: "One size", qty: 2 });
      if (added.refused) return `I couldn't add them: ${added.result}`;
      await call("view_cart");
      const q = await readCart();
      return `Added 2 × 32oz Wide Mouth Ultralite Bottle at $11.99 each. Your cart total is ${money(q.totalCents)}.`;
    },
  },
  {
    label: "Read me the cart",
    async script() {
      const c = await call("view_cart");
      return c.result;
    },
  },
  {
    label: "Pay for the cart",
    async script() {
      await call("view_cart");
      // An agent looks for a way to pay. There is none to find.
      await call("pay");
      return "I can't pay. This page gives agents no payment tool; paying stays with you at checkout.";
    },
  },
];

export async function runTask(task: Task) {
  if (run?.busy) return;
  set({ task: task.label, calls: [], reply: null, busy: true });
  let reply: string;
  try {
    reply = await task.script();
  } catch {
    reply = "Something went wrong reaching the shop. Nothing was changed.";
  }
  set({ ...run!, reply, busy: false });
}

export { describeCart };
