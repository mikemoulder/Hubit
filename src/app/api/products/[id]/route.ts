import { NextResponse } from "next/server";
import { getCatalog } from "@/server/catalog";
import { detail } from "@/server/catalog/present";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const product = getCatalog().byId.get((await params).id);
  if (!product) return NextResponse.json({ error: "No such product" }, { status: 404 });
  return NextResponse.json(detail(product));
}
