import { NextResponse } from "next/server";
import { getCatalog } from "@/server/catalog";
import { recheck, readerFor } from "@/server/checkout/recheck";
import { recordRecheck } from "@/server/db/history";
import snapshot from "../../../../../data/catalog-snapshot.json" with { type: "json" };
import { forShopper, parseLines } from "../shared";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const lines = parseLines(body?.lines);
  if (!lines) return NextResponse.json({ error: "Expected { lines: [...] } with at least one line" }, { status: 400 });
  const catalog = getCatalog();
  const { reader, mode } = readerFor(catalog, snapshot.fx.rates);
  const r = await recheck(catalog, lines, reader, mode);
  await recordRecheck(r);
  return NextResponse.json(forShopper(r));
}
