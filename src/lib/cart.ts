"use client";

import { useSyncExternalStore } from "react";

// The shopper's one cart. It holds only what was chosen (product, option, quantity,
// and who added it); every price, fee and source is worked out by the server in
// /api/cart/quote, so nothing the browser holds can change what is charged.

export type Actor = "human" | "agent";

export type CartLine = {
  productId: string;
  option: string;
  qty: number;
  by: Actor;
};

export const MAX_QTY = 10;
const KEY = "hubit.cart.v2";

let lines: CartLine[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) lines = JSON.parse(raw);
  } catch {
    lines = [];
  }
}

function commit(next: CartLine[]) {
  lines = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Private windows can refuse storage; the cart still works for this tab.
  }
  for (const l of listeners) l();
}

const same = (a: CartLine, productId: string, option: string) => a.productId === productId && a.option === option;

export function addLine(productId: string, option: string, qty = 1, by: Actor = "human") {
  load();
  const existing = lines.find((l) => same(l, productId, option));
  if (existing) {
    commit(lines.map((l) => (l === existing ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty), by } : l)));
  } else {
    commit([...lines, { productId, option, qty: Math.min(MAX_QTY, Math.max(1, qty)), by }]);
  }
}

export function setQty(productId: string, option: string, qty: number, by: Actor = "human") {
  load();
  if (qty <= 0) return removeLine(productId, option);
  commit(lines.map((l) => (same(l, productId, option) ? { ...l, qty: Math.min(MAX_QTY, qty), by } : l)));
}

export function removeLine(productId: string, option: string) {
  load();
  commit(lines.filter((l) => !same(l, productId, option)));
}

export function clearCart() {
  commit([]);
}

export function getLines(): CartLine[] {
  load();
  return lines;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    loaded = false;
    load();
    fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

const EMPTY: CartLine[] = [];

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, getLines, () => EMPTY);
}
