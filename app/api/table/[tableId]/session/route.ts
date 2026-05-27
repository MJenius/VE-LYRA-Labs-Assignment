import { NextResponse } from "next/server";
import { getOrCreateSession, joinSession } from "@/lib/services/session";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 0;

export async function GET(request: Request, { params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;
  const url = new URL(request.url);
  const displayName = url.searchParams.get("displayName") || "Guest";
  const session = joinSession(getOrCreateSession(tableId).id, displayName);

  return NextResponse.json({ session });
}
