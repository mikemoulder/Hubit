"use client";

import { Catalog } from "@/components/Catalog";
import { CartDrawer, QuickView } from "@/components/Overlays";
import { RulesBar } from "@/components/RulesBar";
import { SiteFooter, SiteHeader } from "@/components/Shell";
import { DemoShopper } from "@/components/DemoShopper";
import { Intro } from "@/components/Intro";
import { ToolRail } from "@/components/ToolRail";
import { useToolSurface, useRuntime, useStore } from "@/lib/useHubit";
import { setView } from "@/lib/store";

export default function Page() {
  useToolSurface();
  const runtime = useRuntime();

  // Which shelf, which search, which overlay: all of it lives in the store rather than
  // in useState, because `filter_catalog` and `focus_product` write to it from a tool
  // callback that runs outside React entirely. Moving this out of the component is what
  // lets the agent point at something instead of only reporting it afterwards.
  const { category, query, cartOpen, quickView } = useStore().view;

  return (
    <>
      {/* Header and rules travel together, so the gate never scrolls off screen. */}
      <div className="sticky top-0 z-30">
        <SiteHeader
          active={category}
          onCategory={(c) => setView({ category: c })}
          query={query}
          onSearch={(q) => setView({ query: q })}
          onOpenCart={() => setView({ cartOpen: true })}
        />
        <RulesBar />
      </div>

      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {runtime === "local" && <Intro />}

        {/* On a phone the column stacks, and the agent column comes before the shelf:
            behind forty products the demo shopper is never found. */}
        <div className="order-2 min-w-0 lg:order-none">
          <Catalog
            category={category}
            query={query}
            onQuickView={(id) => setView({ quickView: id })}
          />
        </div>

        <aside className="order-1 flex flex-col lg:sticky lg:top-[8.5rem] lg:order-none lg:h-[calc(100vh-10rem)]">
          <div className="min-h-0 flex-1">
            <ToolRail />
          </div>
          {runtime === "local" && (
            <>
              <DemoShopper />
              <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
                No agent is connected to this tab. The tool surface above is the real one, and
                the demo shopper calls it exactly as an agent would.
              </p>
            </>
          )}
        </aside>
      </main>

      <SiteFooter onCategory={(c) => setView({ category: c })} />

      <CartDrawer open={cartOpen} onClose={() => setView({ cartOpen: false })} />
      <QuickView id={quickView} onClose={() => setView({ quickView: null })} />
    </>
  );
}
