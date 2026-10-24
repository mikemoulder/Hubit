import { NextResponse } from "next/server";
import { getCatalog } from "@/server/catalog";
import { quote, type QuoteRequestLine } from "@/server/cart/quote";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const raw: unknown = body?.lines;
  if (!Array.isArray(raw)) return NextResponse.json({ error: "Expected { lines: [...] }" }, { status: 400 });
  const lines: QuoteRequestLine[] = raw
    .filter((l) => l && typeof l.productId === "string" && typeof l.option === "string")
    .map((l) => ({ productId: l.productId, option: l.option, qty: Number(l.qty) }));
  const q = quote(getCatalog(), lines);
  // Shoppers never see which store fulfils a line; that stays server side.
  return NextResponse.json({ ...q, lines: q.lines.map((l) => ({ ...l, fulfilledBy: undefined })) });
}
