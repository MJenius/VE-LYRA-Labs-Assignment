import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOtp } from "@/lib/services/otp";

export const runtime = "nodejs";

const SendOtpBodySchema = z.object({
  phone: z.string().min(10).max(16)
});

export async function POST(request: Request) {
  const body = SendOtpBodySchema.parse(await request.json());
  return NextResponse.json(sendOtp(body.phone));
}
