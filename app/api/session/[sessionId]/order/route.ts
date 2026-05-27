import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrderAfterValidation } from "@/lib/services/order";

export const runtime = "nodejs";

const OrderBodySchema = z.object({
  customerName: z.string().min(2).max(80),
  customerPhone: z.string().min(10).max(16)
});

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const body = OrderBodySchema.parse(await request.json());
  return NextResponse.json({
    order: createOrderAfterValidation({
      sessionId,
      customerName: body.customerName,
      customerPhone: body.customerPhone
    })
  });
}
