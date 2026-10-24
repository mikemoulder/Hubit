import { NextResponse } from "next/server";
import { getCatalog } from "@/server/catalog";
import { syncStores } from "@/server/db/sync";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Called once a day by Vercel Cron, which sends the CRON_SECRET as a bearer token. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const r = await syncStores(getCatalog());
  return NextResponse.json({ read: r.read.length, failed: r.failed, points: r.points });
}
