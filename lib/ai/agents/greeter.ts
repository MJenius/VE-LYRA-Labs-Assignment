import type { OrchestratorResponse, TableSession } from "@/lib/domain/types";
import { getCart } from "@/lib/services/cart";

export function runGreeterAgent(session: TableSession): Pick<OrchestratorResponse, "message" | "suggestions" | "cart"> {
  return {
    message:
      "Hi, I am Zara. Tell me the vibe today: spicy, light, filling, sweet, or surprise me, and I will keep the whole table in sync.",
    suggestions: [],
    cart: getCart(session.id)
  };
}
