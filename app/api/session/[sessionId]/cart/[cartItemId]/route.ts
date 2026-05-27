import { NextResponse } from "next/server";
import { z } from "zod";
import { removeCartItem, updateCartItem } from "@/lib/services/cart";

export const runtime = "nodejs";

const PatchCartBodySchema = z.object({
  quantity: z.number().int().min(0).optional(),
  specialInstructions: z.string().max(160).optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string; cartItemId: string }> }
) {
  const { sessionId, cartItemId } = await params;
  const body = PatchCartBodySchema.parse(await request.json());
  return NextResponse.json({
    cart: updateCartItem(sessionId, cartItemId, body)
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string; cartItemId: string }> }
) {
  const { sessionId, cartItemId } = await params;
  return NextResponse.json({
    cart: removeCartItem(sessionId, cartItemId)
  });
}
