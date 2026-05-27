import { NextResponse } from "next/server";
import { z } from "zod";
import { handleUserMessage } from "@/lib/ai/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 0;

const ChatBodySchema = z.object({
  tableId: z.string().min(1),
  text: z.string().min(1).max(500),
  speaker: z.string().min(1).max(40).default("Guest")
});

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const body = ChatBodySchema.parse(await request.json());
  const response = handleUserMessage({
    sessionId,
    tableId: body.tableId,
    text: body.text,
    speaker: body.speaker
  });

  return NextResponse.json(response);
}
