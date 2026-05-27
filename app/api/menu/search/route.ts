import { NextResponse } from "next/server";
import { searchMenuSemantically } from "@/lib/ai/rag";

export const runtime = "nodejs";

export function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const topK = Number(url.searchParams.get("topK") || 8);

  return NextResponse.json({
    query,
    results: searchMenuSemantically({ query, topK })
  });
}
