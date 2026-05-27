import { NextResponse } from "next/server";
import { z } from "zod";
import { getMenuItemById } from "@/lib/data/menu";
import { runUpsellAgent } from "@/lib/ai/agents/upsell";
import { addCartItem, getCart } from "@/lib/services/cart";

export const runtime = "nodejs";
export const revalidate = 0;

const AddCartBodySchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  addedBy: z.string().min(1).max(40).default("Guest"),
  specialInstructions: z.string().max(160).optional()
});

export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return NextResponse.json({ cart: getCart(sessionId) });
}

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const body = AddCartBodySchema.parse(await request.json());
  const result = addCartItem(sessionId, body);
  const addedItem = getMenuItemById(body.itemId);

  return NextResponse.json({
    cart: result.cart,
    cartItem: result.cartItem,
    upsell: runUpsellAgent({ cart: result.cart, addedItem })
  });
}
