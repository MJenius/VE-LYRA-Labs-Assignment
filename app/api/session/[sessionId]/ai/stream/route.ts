import { getRecentMessages } from "@/lib/services/session";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const encoder = new TextEncoder();
  const lastAssistantMessage =
    [...getRecentMessages(sessionId, 12)].reverse().find((message) => message.role === "assistant")?.content ||
    "Ask Zara what you feel like eating, and she will route it to the right dining agent.";

  const stream = new ReadableStream({
    async start(controller) {
      const tokens = lastAssistantMessage.split(/(\s+)/).filter(Boolean);
      for (const token of tokens) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
        await new Promise((resolve) => setTimeout(resolve, 18));
      }
      controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
