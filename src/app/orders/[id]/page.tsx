import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, FileText, Package, Store } from "lucide-react";
import { money, sized } from "@/lib/format";
import { getCatalog, sourceName } from "@/server/catalog";
import { stripe } from "@/server/stripe";

export const metadata: Metadata = { title: "Your order" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  if (!/^in_[A-Za-z0-9]+$/.test(id)) return null;
  try {
    const s = stripe();
    const invoice = await s.invoices.retrieve(id, { expand: ["customer"] });
    if (invoice.metadata?.hubit !== "order") return null;
    const lines = await s.invoices.listLineItems(id, { limit: 100 });
    return { invoice, lines: lines.data };
  } catch {
    return null;
  }
}

export default async function OrderPage({ params }: Props) {
  const data = await load((await params).id);
  if (!data) notFound();
  const { invoice, lines } = data;
  const catalog = getCatalog();
  const customer = typeof invoice.customer === "object" && invoice.customer && !("deleted" in invoice.customer) ? invoice.customer : null;
  const ship = customer?.shipping;

  const items = lines.filter((l) => l.metadata?.kind === "item");
  const fee = (kind: string) => lines.find((l) => l.metadata?.kind === kind)?.amount ?? 0;
  const byStore = new Map<string, typeof items>();
  for (const l of items) {
    const key = l.metadata.sourceId || "unknown";
    byStore.set(key, [...(byStore.get(key) ?? []), l]);
  }
  const placed = new Date(invoice.created * 1000);

  return (
    <main className="px-[var(--margin)] pb-10 pt-6">
      <p className="flex items-center gap-2 text-[15px]" data-testid="order-status">
        <Check className="size-4" aria-hidden /> {invoice.status === "paid" ? "Paid" : invoice.status} · {placed.toUTCString().slice(5, 22)} UTC
      </p>
      <h1 className="display mt-2 text-[clamp(28px,3vw,44px)]" data-testid="order-number">
        Order {invoice.number}
      </h1>
      <p className="mt-3 max-w-[60ch]">
        Thanks{customer?.name ? `, ${customer.name.split(" ")[0]}` : ""}. One payment covered everything; Hubit has passed each item to the
        store that has it. Your invoice is ready to download, and we&rsquo;ll use {customer?.email} for updates.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section aria-labelledby="ship-h">
          <h2 id="ship-h" className="text-[20px] font-semibold">
            How it ships
          </h2>
          <p className="mt-1 text-[15px]">
            {byStore.size === 1 ? "One store fulfils this order." : `${byStore.size} stores fulfil this order, each sending its part.`}
          </p>
          <ol className="mt-5 space-y-3" data-testid="fulfilment">
            {[...byStore.entries()].map(([sourceId, group]) => (
              <li key={sourceId} className="bg-[var(--color-surface)] p-5" data-testid="fulfilment-group" data-source={sourceId}>
                <p className="flex items-center gap-2 font-medium">
                  <Store className="size-4" aria-hidden /> Ships from {sourceName(sourceId)}
                </p>
                <ul className="mt-3 space-y-3">
                  {group.map((l) => {
                    const p = catalog.byId.get(l.metadata.productId);
                    return (
                      <li key={l.id} className="flex gap-3 text-[15px]" data-testid="order-line">
                        {p?.images[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={sized(p.images[0], 160)} alt="" className="size-16 shrink-0 bg-[#f6f6f6] object-cover" />
                        )}
                        <span className="min-w-0 flex-1">
                          <Link href={`/p/${l.metadata.productId}`} className="link-line line-clamp-2">
                            {p?.title ?? l.description}
                          </Link>
                          <span className="text-[13px] text-[var(--color-muted)]">
                            {l.metadata.option !== "One size" ? `${l.metadata.option} · ` : ""}Qty {l.metadata.qty}
                          </span>
                        </span>
                        <span className="tabular-nums">{money(l.amount)}</span>
                      </li>
                    );
                  })}
                </ul>
                <ol className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px]" aria-label="Progress">
                  <li className="flex items-center gap-1"><Check className="size-3.5" aria-hidden /> Paid</li>
                  <li className="flex items-center gap-1"><Check className="size-3.5" aria-hidden /> Sent to {sourceName(sourceId)}</li>
                  <li className="flex items-center gap-1 text-[var(--color-muted)]"><Package className="size-3.5" aria-hidden /> Shipping (test mode: nothing ships)</li>
                </ol>
              </li>
            ))}
          </ol>
        </section>

        <aside className="h-fit bg-[var(--color-ink)] p-6 text-[var(--color-ink-fg)]">
          <h2 className="text-[20px] font-semibold">Receipt</h2>
          <dl className="mt-5 space-y-2.5 text-[15px]">
            <Row label="Items" value={money(items.reduce((n, l) => n + l.amount, 0))} testid="order-subtotal" />
            <Row label="Shipping" value={fee("shipping") ? money(fee("shipping")) : "Free"} testid="order-shipping" />
            <Row label="Service fee (5%)" value={money(fee("service-fee"))} testid="order-fee" />
            <div className="pt-3 text-[20px] font-semibold">
              <Row label="Paid" value={money(invoice.amount_paid)} testid="order-total" />
            </div>
          </dl>
          {ship?.address && (
            <div className="mt-6 text-[15px]">
              <p className="font-medium">Delivering to</p>
              <p className="mt-1">
                {ship.name}
                <br />
                {ship.address.line1}
                {ship.address.line2 ? `, ${ship.address.line2}` : ""}
                <br />
                {ship.address.city} {ship.address.postal_code}, {ship.address.country}
              </p>
            </div>
          )}
          <div className="mt-6 grid gap-2">
            {invoice.invoice_pdf && (
              <a href={invoice.invoice_pdf} className="btn btn-invert" data-testid="invoice-pdf">
                <FileText className="size-4" aria-hidden /> Download invoice (PDF)
              </a>
            )}
            {invoice.hosted_invoice_url && (
              <a href={invoice.hosted_invoice_url} className="link-line py-2 text-center text-[15px] underline" target="_blank" rel="noreferrer">
                View invoice on Stripe
              </a>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function Row({ label, value, testid }: { label: string; value: string; testid: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd className="tabular-nums" data-testid={testid}>
        {value}
      </dd>
    </div>
  );
}
