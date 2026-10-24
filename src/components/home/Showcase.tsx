"use client";

import { useEffect, useRef, useState } from "react";
import { money } from "@/lib/format";

export type SizeRoute = {
  option: string;
  stores: { name: string; priceCents: number; available: boolean }[];
};

/**
 * One shoe, held in a frame while the page scrolls: whole, then two details. The
 * caption that arrives at the third distance carries the live thing: choose a size
 * and see which of the five stores Hubit would ship it from, and at what price.
 */
export function Showcase({
  first,
  last,
  image,
  alt,
  productHref,
  caption,
  sizes,
}: {
  first: string;
  last: string;
  image: string;
  alt: string;
  productHref: string;
  caption: string;
  sizes: SizeRoute[];
}) {
  const root = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(1);
  const firstOpen = sizes.find((s) => s.stores.some((x) => x.available))?.option ?? null;
  const [chosen, setChosen] = useState<string | null>(firstOpen);

  useEffect(() => {
    const markers = root.current?.querySelectorAll<HTMLElement>("[data-mark]");
    if (!markers) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setStage(Number((e.target as HTMLElement).dataset.mark));
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    markers.forEach((m) => io.observe(m));
    return () => io.disconnect();
  }, []);

  const pick = sizes.find((s) => s.option === chosen);
  const open = pick?.stores.filter((s) => s.available) ?? [];
  const best = open.reduce<(typeof open)[number] | null>((b, s) => (!b || s.priceCents < b.priceCents ? s : b), null);

  return (
    <section ref={root} className="show" data-stage={stage} aria-labelledby="show-title">
      <div className="show__markers" aria-hidden>
        <span data-mark="1" />
        <span data-mark="2" />
        <span data-mark="3" />
      </div>
      <div className="show__stage">
        <h2 id="show-title" className="contents">
          <span className="show__first display">{first}</span>
          <span className="show__last display">{last}</span>
        </h2>
        <a href={productHref} className="show__frame" aria-label={`View ${alt}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={alt} width={1000} height={1250} />
        </a>
        <div className="show__caption">
          <p>{caption}</p>
          <p className="mt-5 font-medium">Try a size</p>
          <div className="sizes" role="group" aria-label="Sizes">
            {sizes.map((s) => {
              const any = s.stores.some((x) => x.available);
              return (
                <button key={s.option} type="button" disabled={!any} aria-pressed={chosen === s.option} onClick={() => setChosen(s.option)}>
                  {s.option}
                </button>
              );
            })}
          </div>
          <p className="route-out" aria-live="polite" data-testid="route-out">
            {pick && best
              ? `Size ${pick.option}: in stock at ${open.length} of ${pick.stores.length} stores. Hubit ships it from ${best.name} at ${money(best.priceCents)}.`
              : "Choose a size to see where it would ship from."}
          </p>
        </div>
      </div>
    </section>
  );
}
