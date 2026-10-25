import { NextResponse } from "next/server";
import { getCatalog } from "@/server/catalog";
import { payForQuote, validateDetails, type Address, type Contact } from "@/server/checkout/pay";
import { recheck, readerFor } from "@/server/checkout/recheck";
import { recordOrder } from "@/server/db/history";
import { TEST_CARDS, type TestCard } from "@/server/stripe";
import snapshot from "../../../../../data/catalog-snapshot.json" with { type: "json" };
import { forShopper, parseLines } from "../shared";

/**
 * Re-checks the cart against its stores once more, and charges only if the total
 * is still the one the shopper agreed to. Any change sends the shopper back to
 * review it; nothing is charged in between.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const lines = parseLines(body?.lines);
  if (!lines) return NextResponse.json({ error: "Expected lines" }, { status: 400 });

  const contact: Partial<Contact> = body?.contact ?? {};
  const address: Partial<Address> = body?.address ?? {};
  const errors = validateDetails(contact, address);
  if (Object.keys(errors).length) return NextResponse.json({ reason: "invalid", errors }, { status: 422 });

  const card = body?.card as TestCard;
  if (!(card in TEST_CARDS)) return NextResponse.json({ reason: "invalid", errors: { card: "Choose a test card" } }, { status: 422 });

  const catalog = getCatalog();
  const { reader, mode } = readerFor(catalog, snapshot.fx.rates);
  const r = await recheck(catalog, lines, reader, mode);
  if (!r.quote.purchasable) return NextResponse.json({ reason: "unavailable", review: forShopper(r) }, { status: 409 });
  if (r.quote.totalCents !== Number(body?.expectedTotalCents)) {
    return NextResponse.json({ reason: "changed", review: forShopper(r) }, { status: 409 });
  }

  const by = body?.by === "agent" ? "agent" : "human";
  const result = await payForQuote(r.quote, contact as Contact, address as Address, card, by);
  if (!result.ok) return NextResponse.json({ reason: "declined", message: result.message }, { status: 402 });
  await recordOrder(result.orderId, result.number, r.quote, by);
  return NextResponse.json(result);
}
