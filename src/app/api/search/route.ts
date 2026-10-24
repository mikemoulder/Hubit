import { NextResponse } from "next/server";
import { getCatalog } from "@/server/catalog";
import { parseQuery, summary } from "@/server/catalog/present";
import { search } from "@/server/catalog/search";

export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const r = search(getCatalog(), parseQuery(params));
  return NextResponse.json({ ...r, items: r.items.map(summary) });
}
