import { beforeEach, describe, expect, it } from "vitest";
import { resetDemoStore } from "@/lib/data/store";
import { handleUserMessage } from "@/lib/ai/orchestrator";
import { getCart } from "@/lib/services/cart";
import { getOrCreateSession } from "@/lib/services/session";

describe("Router-Orchestrator", () => {
  beforeEach(() => resetDemoStore());

  it("routes Hinglish dietary requests to the RAG recommendation agent", () => {
    const session = getOrCreateSession("T4");
    const response = handleUserMessage({
      sessionId: session.id,
      tableId: session.tableId,
      text: "light snack chahiye, dairy allergy hai",
      speaker: "Asha"
    });

    expect(response.route).toBe("RECOMMEND");
    expect(response.language).toBe("hinglish");
    expect(response.suggestions.length).toBeGreaterThan(0);
    expect(response.suggestions.every((item) => !item.allergens.includes("dairy"))).toBe(true);
    expect(response.agentTrace.map((step) => step.agent)).toContain("Recommendation Agent");
  });

  it("can add items through natural language and trigger an upsell", () => {
    const session = getOrCreateSession("T9");
    const response = handleUserMessage({
      sessionId: session.id,
      tableId: session.tableId,
      text: "add garlic naan to our order",
      speaker: "Dev"
    });

    expect(response.route).toBe("ADD_ITEM");
    expect(getCart(session.id).items).toHaveLength(1);
    expect(response.upsell).toBeDefined();
    expect(response.agentTrace.map((step) => step.agent)).toContain("Upsell Agent");
  });
});
