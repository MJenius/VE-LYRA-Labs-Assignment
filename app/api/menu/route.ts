import { NextResponse } from "next/server";
import { menuItems } from "@/lib/data/menu";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 0;

export function GET() {
  return NextResponse.json({ items: menuItems });
}
