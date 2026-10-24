import { money } from "@/lib/format";
import type { Reading } from "@/server/db/history";

const ORIGIN = { snapshot: "Store catalogue", sync: "Daily store check", recheck: "Checked at checkout" } as const;
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";

/** Hubit's price for a product each time its stores were read, newest first. */
export function PriceHistory({ readings, currentCents }: { readings: Reading[]; currentCents: number }) {
  if (readings.length === 0) return null;
  const latest = readings.at(-1)!;
  const values = readings.map((r) => r.priceCents);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const W = 560;
  const H = 120;
  const x = (i: number) => (readings.length === 1 ? W / 2 : (i / (readings.length - 1)) * (W - 16) + 8);
  const y = (v: number) => (hi === lo ? H / 2 : H - 12 - ((v - lo) / (hi - lo)) * (H - 24));
  const path = readings.map((r, i) => `${i ? "H" : "M"}${x(i).toFixed(1)}${i ? ` V${y(r.priceCents).toFixed(1)}` : ` ${y(r.priceCents).toFixed(1)}`}`).join(" ");

  return (
    <section aria-labelledby="history-h" className="mt-24 max-w-3xl" data-testid="price-history">
      <h2 id="history-h" className="display text-[clamp(28px,3vw,44px)]">
        Price history
      </h2>
      <p className="mt-3 max-w-[60ch]">
        Hubit&rsquo;s price each time this product&rsquo;s stores were read: in the store catalogue, in the daily check, and whenever
        someone reached checkout with it.
      </p>
      {latest.priceCents !== currentCents && (
        <p className="mt-3 bg-[var(--color-ink)] px-4 py-3 text-[var(--color-ink-fg)]" data-testid="history-latest-note">
          Latest store reading: {money(latest.priceCents)} ({when(latest.seenAt)}). You&rsquo;ll see the up-to-date price at checkout.
        </p>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-6 w-full" role="img" aria-label={`Price from ${money(readings[0].priceCents)} to ${money(latest.priceCents)}`}>
        <path d={path} fill="none" stroke="var(--color-ink)" strokeWidth="2.5" />
        {readings.map((r, i) => (
          <circle key={i} cx={x(i)} cy={y(r.priceCents)} r="4" fill="var(--color-ink)" />
        ))}
      </svg>
      <ol className="mt-4 space-y-1.5" data-testid="history-readings">
        {[...readings].reverse().slice(0, 8).map((r) => (
          <li key={r.seenAt} className="flex flex-wrap justify-between gap-x-4 bg-[var(--color-surface)] px-4 py-2.5 text-[15px]" data-testid="history-reading">
            <span>
              <span className="font-semibold tabular-nums">{money(r.priceCents)}</span>
              {!r.available && " · sold out everywhere"}
              <span className="text-[var(--color-muted)]"> · {ORIGIN[r.origin]}</span>
            </span>
            <span className="tabular-nums text-[var(--color-muted)]">{when(r.seenAt)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
