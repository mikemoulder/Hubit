"use client";

import { useSyncExternalStore } from "react";
import { Bot, Square } from "lucide-react";
import { getShopper, startShopper, stopShopper, subscribeShopper } from "@/lib/demoShopper";

/**
 * The stand-in agent for every browser that is not exposing WebMCP. One button starts
 * it; it narrates each step in plain words while the tool rail above shows the calls.
 * When it reaches the gate it stops and says so, because the gate is the product: the
 * human approves, and only then does `checkout` exist for it to call.
 */
export function DemoShopper() {
  const { phase, lines } = useSyncExternalStore(subscribeShopper, getShopper, getShopper);
  const busy = phase === "running" || phase === "waiting";

  return (
    <section
      aria-label="Demo shopper"
      className="mt-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <Bot className="size-4 text-[var(--color-accent)]" aria-hidden />
            Demo shopper
          </h2>
          <p className="text-xs text-[var(--color-muted)]">
            A scripted agent on the same tools. It cannot check out until you approve.
          </p>
        </div>
        {busy ? (
          <button
            type="button"
            data-audit="stop-shopper"
            onClick={stopShopper}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]"
          >
            <Square className="size-3" aria-hidden />
            Stop
          </button>
        ) : (
          <button
            type="button"
            data-audit="run-shopper"
            onClick={startShopper}
            className="shrink-0 rounded-full bg-[var(--color-ink)] px-3.5 py-1.5 text-xs font-medium text-[var(--color-ink-fg)] transition-opacity hover:opacity-90"
          >
            {phase === "idle" ? "Run the demo shopper" : "Run again"}
          </button>
        )}
      </div>

      {lines.length > 0 && (
        <ol aria-live="polite" className="thin-scroll mt-3 max-h-40 space-y-1 overflow-y-auto text-xs">
          {lines.map((l) => (
            <li
              key={l.id}
              className={
                l.tone === "refused"
                  ? "font-medium text-[var(--color-danger)]"
                  : l.tone === "done"
                    ? "font-medium text-[var(--color-ok)]"
                    : "text-[var(--color-fg)]"
              }
            >
              {l.text}
            </li>
          ))}
        </ol>
      )}

      {phase === "waiting" && (
        <p className="mt-2 rounded-full bg-[var(--color-accent-soft)] px-3 py-1.5 text-xs font-medium text-[var(--color-accent)]">
          Waiting for you to approve this basket
        </p>
      )}
    </section>
  );
}
