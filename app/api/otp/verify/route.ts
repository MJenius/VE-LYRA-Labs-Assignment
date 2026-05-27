import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/services/otp";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 0;

const VerifyOtpBodySchema = z.object({
  phone: z.string().min(10).max(16),
  otp: z.string().length(6)
});

export async function POST(request: Request) {
  const body = VerifyOtpBodySchema.parse(await request.json());
  return NextResponse.json(verifyOtp(body.phone, body.otp));
}
