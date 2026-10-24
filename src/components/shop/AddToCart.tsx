"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { money } from "@/lib/format";
import { addLine, useCart } from "@/lib/cart";

type Option = { option: string; available: boolean; priceCents: number };

/**
 * The option picker and the add button. Sizes come from every store that stocks the
 * product, so a size one shop has sold out of is still buyable when another has it.
 */
export function AddToCart({ productId, options }: { productId: string; options: Option[] }) {
  const single = options.length === 1 && options[0].option === "One size";
  const firstInStock = options.find((o) => o.available)?.option ?? null;
  const [chosen, setChosen] = useState<string | null>(single ? firstInStock : null);
  const [added, setAdded] = useState(false);
  const inCart = useCart().filter((l) => l.productId === productId).reduce((n, l) => n + l.qty, 0);
  const pick = options.find((o) => o.option === chosen);

  if (!firstInStock) {
    return (
      <p className="bg-[var(--color-surface-2)] px-4 py-3" data-testid="sold-out">
        Sold out at every store we source from.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {!single && (
        <fieldset>
          <legend className="font-medium">
            Choose an option {chosen && <span className="font-normal text-[var(--color-muted)]">: {chosen}</span>}
          </legend>
          <div className="mt-2 flex flex-wrap gap-2" data-testid="options">
            {options.map((o) => (
              <button
                key={o.option}
                type="button"
                disabled={!o.available}
                aria-pressed={chosen === o.option}
                onClick={() => {
                  setChosen(o.option);
                  setAdded(false);
                }}
                className={[
                  "min-h-11 min-w-12 px-3 text-[15px] tabular-nums transition-colors active:scale-95",
                  chosen === o.option
                    ? "bg-[var(--color-ink)] text-[var(--color-ink-fg)]"
                    : "bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)]",
                  o.available ? "" : "cursor-not-allowed text-[var(--color-muted)] line-through opacity-60",
                ].join(" ")}
              >
                {o.option}
                {!o.available && <span className="sr-only"> (sold out)</span>}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {pick && pick.priceCents && (
        <p className="text-[15px]">
          {single ? "Price" : `Price in ${pick.option}`}: <span className="font-semibold tabular-nums text-[var(--color-fg)]" data-testid="option-price">{money(pick.priceCents)}</span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!chosen}
          data-testid="add-to-cart"
          onClick={() => {
            if (!chosen) return;
            addLine(productId, chosen);
            setAdded(true);
          }}
          className="btn min-h-14 w-full px-8 sm:w-auto"
        >
          {chosen ? "Add to cart" : "Choose an option first"}
        </button>
        {added && (
          <p className="flex items-center gap-1.5 text-[15px]" role="status" data-testid="added-status">
            <Check className="size-4 text-[var(--color-ok)]" aria-hidden />
            Added. {inCart} in your cart.{" "}
            <Link href="/cart" className="link-line font-medium underline">
              View cart
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
