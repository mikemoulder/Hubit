"use client";

import { Bot } from "lucide-react";
import { startShopper } from "@/lib/demoShopper";

/**
 * The first thing a cold visitor reads. Without it the page is a well made shop, and the
 * one idea that makes it different (the agent cannot buy until you approve) only shows
 * up once something is in the cart. The button starts the same demo shopper as the
 * panel and brings the panel into view, which on a phone is directly below this strip.
 */
export function Intro() {
  const run = () => {
    startShopper();
    document
      .querySelector('[aria-label="Demo shopper"]')
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <section
      aria-label="What Hubit is"
      className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:col-span-2"
    >
      <div className="min-w-0">
        <p className="text-base font-semibold tracking-[-0.01em]">
          An agent can fill this cart. It cannot buy until you approve this exact basket.
        </p>
        <p className="mt-0.5 text-sm text-[var(--color-muted)]">
          Set your rules above, then watch a scripted agent shop on the real tool surface and
          stop at the gate.
        </p>
      </div>
      <button
        type="button"
        data-audit="intro-run-shopper"
        onClick={run}
        className="flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-[var(--color-ink-fg)] transition-opacity hover:opacity-90"
      >
        <Bot className="size-4" aria-hidden />
        Run the demo shopper
      </button>
    </section>
  );
}
