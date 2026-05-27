import { NextResponse } from "next/server";
import { menuItems } from "@/lib/data/menu";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ items: menuItems });
}
