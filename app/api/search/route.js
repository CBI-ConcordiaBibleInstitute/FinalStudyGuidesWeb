// Public search endpoint. Client components hit this instead of importing
// from lib/catalog (server-only). RLS restricts results to published rows.
import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  try {
    const data = await searchCatalog(q);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message ?? "search failed" }, { status: 500 });
  }
}
