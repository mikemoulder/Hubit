import { CATALOG, byId, money } from "./catalog";
import * as store from "./store";
import type { ToolResult } from "./types";
import { getHost } from "./webmcp";

/**
 * A scripted agent for browsers without WebMCP. It is not a model and makes no network
 * call: it walks the same tool surface an agent sees, through getHost().call, so every
 * step lands in the call log and the gate binds it exactly as it binds a real agent.
 * When `checkout` is not registered, the shopper cannot reach it either. It says so and
 * waits for the human.
 *
 * Deterministic on purpose: the same cart every run, so a test can assert totals.
 */

export type ShopperPhase = "idle" | "running" | "waiting" | "done" | "stopped";
export type ShopperLine = { id: number; text: string; tone: "step" | "refused" | "done" };
export type ShopperState = { phase: ShopperPhase; lines: ShopperLine[] };

const DESK_SETUP = ["mon-ultra-34", "desk-standing-160", "chair-ergo-mesh", "kb-mech-tkl"];
const DEMO_ADDRESS = {
  full_name: "Ada Lovelace",
  email: "ada@example.com",
  line1: "12 Marconi Road",
  city: "Lagos",
  postcode: "101233",
  country: "Nigeria",
};
const PAUSE_MS = 600;

let state: ShopperState = { phase: "idle", lines: [] };
const listeners = new Set<() => void>();
let run: AbortController | null = null;
let lineId = 0;

export const getShopper = () => state;
export function subscribeShopper(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function set(next: Partial<ShopperState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}
function say(text: string, tone: ShopperLine["tone"] = "step") {
  set({ lines: [...state.lines, { id: ++lineId, text, tone }] });
}

class Stopped extends Error {}

function pause(signal: AbortSignal, ms = PAUSE_MS) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new Stopped());
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Stopped());
    }, { once: true });
  });
}

/** Resolves when `name` is on the surface. The surface is rebuilt by React after a
 *  state change, so this listens to the host rather than to the store. */
function untilRegistered(name: string, signal: AbortSignal) {
  const host = getHost();
  return new Promise<void>((resolve, reject) => {
    const has = () => host.list().some((t) => t.name === name);
    if (has()) return resolve();
    const off = host.onChange(() => {
      if (has()) {
        off();
        resolve();
      }
    });
    signal.addEventListener("abort", () => {
      off();
      reject(new Stopped());
    }, { once: true });
  });
}

async function call(name: string, input: Record<string, unknown> = {}): Promise<ToolResult> {
  const res = await getHost().call(name, input);
  // A registered tool records itself through traced(). A refused call never reaches a
  // tool, so the log entry is written here: the refusal is the evidence.
  if (res.isError && !getHost().list().some((t) => t.name === name)) {
    store.recordCall(name, JSON.stringify(input), res.content[0]?.text ?? "", false);
  }
  return res;
}

async function shop(signal: AbortSignal) {
  const step = async (text: string) => {
    await pause(signal);
    say(text);
  };

  await step("Reading your rules.");
  await call("get_constraints");

  await step("Clearing the cart and building a desk setup: monitor, desk, chair, keyboard.");
  await call("clear_cart");
  for (const id of DESK_SETUP) {
    await call("add_to_cart", { product_id: id });
    await pause(signal, 250);
  }

  // Delivery first. Approving a budget proposal also approves the basket, and editing
  // the address after that would withdraw the approval it just granted.
  if (!store.shippingComplete()) {
    await step("Filling in the delivery form.");
    await call("set_shipping_details", DEMO_ADDRESS);
  }

  const over = store.violations().find((v) => v.field === "budgetCents");
  if (over?.overByCents) {
    const kb = byId("kb-mech-tkl")!;
    await step(`That is ${money(over.overByCents)} over your budget. Looking for a cheaper keyboard first.`);
    await call("search_alternatives", { product_id: kb.id });

    const ceiling = kb.priceCents - over.overByCents;
    const swap = CATALOG.filter(
      (p) => p.category === kb.category && p.priceCents <= ceiling && p.id !== kb.id
    ).sort((a, b) => b.priceCents - a.priceCents)[0];

    if (swap) {
      await step(`Swapping the ${kb.name} for the ${swap.name}, which saves ${money(kb.priceCents - swap.priceCents)}.`);
      await call("remove_from_cart", { product_id: kb.id });
      await call("add_to_cart", { product_id: swap.id });
    } else {
      const total = store.orderTotalCents();
      await step(`No keyboard fits. Asking you to raise the budget to ${money(total)}.`);
      await call("propose_constraint_change", {
        field: "budgetCents",
        new_value: total,
        reason: "The cheapest desk setup that meets your list is over budget.",
      });
    }
  }

  await step("Trying to check out.");
  const attempt = await call("checkout");
  if (attempt.isError) {
    say("Refused: checkout is not on my tool surface. Approve this basket and I will place the order.", "refused");
    set({ phase: "waiting" });
    await untilRegistered("checkout", signal);
    set({ phase: "running" });
    await step("You approved the basket. checkout is registered now. Placing the order.");
    await call("checkout");
  }

  await untilRegistered("get_order", signal);
  await call("get_order");
  say(`Order placed for ${money(store.getState().order?.total ?? 0)}. checkout is gone again.`, "done");
}

export async function startShopper() {
  if (state.phase === "running" || state.phase === "waiting") return;
  // A placed order keeps checkout closed for good, so a second run would wait forever.
  // Pressing "Run again" is the shopper starting a new basket, the same as Start over.
  if (store.getState().order) store.reset();
  run = new AbortController();
  set({ phase: "running", lines: [] });
  try {
    await shop(run.signal);
    set({ phase: "done" });
  } catch (err) {
    if (err instanceof Stopped) {
      say("Stopped. Nothing else was done.");
      set({ phase: "stopped" });
    } else {
      say(`Something went wrong: ${err instanceof Error ? err.message : String(err)}`, "refused");
      set({ phase: "stopped" });
    }
  }
}

export function stopShopper() {
  run?.abort();
}
