import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/server/catalog";
import { DEPARTMENTS } from "@/server/catalog/sources";
import { storeStatuses } from "@/server/db/history";

export const metadata: Metadata = { title: "Stores" };
export const dynamic = "force-dynamic";

const PLATFORM = { shopify: "Shopify", woocommerce: "WooCommerce", ebay: "eBay" } as const;
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function StoresPage() {
  const catalog = getCatalog();
  const status = await storeStatuses();
  const label = new Map(DEPARTMENTS.map((d) => [d.id, d.label]));
  const count = new Map<string, number>();
  for (const p of catalog.products) for (const o of p.offers) count.set(o.sourceId, (count.get(o.sourceId) ?? 0) + 1);
  const answered = catalog.sources.filter((s) => !status.get(s.id)?.lastError).length;

  return (
    <main className="px-[var(--margin)] pb-10 pt-6">
      <h1 className="display text-[clamp(28px,3vw,44px)]">{catalog.sources.length} stores</h1>
      <p className="mt-3 max-w-[64ch]">
        Every product on Hubit comes from one of these independent shops. Hubit reads each store&rsquo;s own catalogue once a day, and
        again at checkout for anything in your cart. {answered} of {catalog.sources.length} answered at their last reading.
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-[15px]" data-testid="stores-table">
          <thead>
            <tr className="bg-[var(--color-ink)] text-[var(--color-ink-fg)]">
              {["Store", "Sells", "Runs on", "Products on Hubit", "Ships from", "Last read", "Status"].map((h) => (
                <th key={h} scope="col" className="px-3 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {catalog.sources.map((s, i) => {
              const st = status.get(s.id);
              const lastRead = st?.lastOkAt ?? catalog.takenAt;
              return (
                <tr key={s.id} className={i % 2 ? "bg-[var(--color-surface-2)]" : "bg-[var(--color-surface)]"} data-testid="store-row" data-store={s.id}>
                  <th scope="row" className="px-3 py-3 font-medium">
                    <Link href={`/shop?q=${encodeURIComponent(s.name)}`} className="link-line">
                      {s.name}
                    </Link>
                  </th>
                  <td className="px-3 py-3">{label.get(s.department)}</td>
                  <td className="px-3 py-3">{PLATFORM[s.platform]}</td>
                  <td className="px-3 py-3 tabular-nums">{count.get(s.id) ?? 0}</td>
                  <td className="px-3 py-3">{s.country}</td>
                  <td className="px-3 py-3 tabular-nums">{day(lastRead)}</td>
                  <td className="px-3 py-3">{st?.lastError ? <span className="font-medium text-[var(--color-danger)]">Didn&rsquo;t answer last time</span> : "Answered"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
