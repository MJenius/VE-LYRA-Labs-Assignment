import { runGreeterAgent } from "@/lib/ai/agents/greeter";
import { runGroupCoordinatorAgent } from "@/lib/ai/agents/group-coordinator";
import { persistContextMemory } from "@/lib/ai/agents/memory";
import { runOrderValidationAgent } from "@/lib/ai/agents/order-validation";
import { runRecommendationAgent } from "@/lib/ai/agents/recommendation";
import { runUpsellAgent } from "@/lib/ai/agents/upsell";
import { analyzeUserMessage } from "@/lib/ai/nlu";
import { findMenuItemByNaturalLanguage } from "@/lib/ai/rag";
import type { AgentTraceStep, OrchestratorResponse, Recommendation } from "@/lib/domain/types";
import { addCartItem, getCart } from "@/lib/services/cart";
import { appendMessage, getSession } from "@/lib/services/session";

interface HandleMessageInput {
  sessionId: string;
  tableId: string;
  text: string;
  speaker: string;
}

export function handleUserMessage(input: HandleMessageInput): OrchestratorResponse {
  const session = getSession(input.sessionId);
  if (session.tableId !== input.tableId) throw new Error("Session/table mismatch");

  const trace: AgentTraceStep[] = [];
  const nlu = timed("Multilingual NLU Agent", input.text, () =>
    analyzeUserMessage(input.text, session.preferences)
  );
  trace.push(nlu.trace);

  const preferences = timed("Context Memory Agent", nlu.output, () =>
    persistContextMemory(input.sessionId, nlu.output)
  );
  trace.push(preferences.trace);

  appendMessage({
    sessionId: input.sessionId,
    role: "user",
    content: input.text,
    agentName: input.speaker
  });

  let message = "";
  let suggestions: Recommendation[] = [];
  let upsell = undefined;
  let route = nlu.output.intent;

  if (route === "GREET") {
    const result = timed("Greeter Agent", nlu.output, () => runGreeterAgent(session));
    trace.push(result.trace);
    message = result.output.message;
    suggestions = result.output.suggestions;
  } else if (route === "ADD_ITEM") {
    const item = findMenuItemByNaturalLanguage(nlu.output.itemQuery || input.text);
    if (!item) {
      route = "RECOMMEND";
      const result = timed("Recommendation Agent", nlu.output, () =>
        runRecommendationAgent({
          sessionId: input.sessionId,
          query: input.text,
          preferences: preferences.output
        })
      );
      trace.push(result.trace);
      message = "I could not confidently add that item, so I found close menu matches instead.";
      suggestions = result.output.suggestions;
    } else {
      const addResult = timed("Cart Tool:add_to_cart", { itemId: item.id }, () =>
        addCartItem(input.sessionId, {
          itemId: item.id,
          quantity: 1,
          addedBy: input.speaker
        })
      );
      trace.push(addResult.trace);

      const upsellResult = timed("Upsell Agent", addResult.output.cart, () =>
        runUpsellAgent({ cart: addResult.output.cart, addedItem: item })
      );
      trace.push(upsellResult.trace);
      upsell = upsellResult.output;
      message = `Added ${item.name} to the shared table cart.`;
    }
  } else if (route === "GROUP_MERGE") {
    const result = timed("Group Coordinator Agent", nlu.output, () =>
      runGroupCoordinatorAgent({
        sessionId: input.sessionId,
        query: input.text,
        preferences: preferences.output
      })
    );
    trace.push(result.trace);
    message = result.output.message;
    suggestions = result.output.suggestions;
  } else if (route === "CHECKOUT") {
    const result = timed("Order Validation Agent", nlu.output, () => runOrderValidationAgent(input.sessionId));
    trace.push(result.trace);
    message = `${result.output.message} Use the checkout button and mock OTP 123456 to place the order.`;
  } else {
    route = route === "UPSELL_CHECK" ? "UPSELL_CHECK" : "RECOMMEND";
    const result = timed("Recommendation Agent", nlu.output, () =>
      runRecommendationAgent({
        sessionId: input.sessionId,
        query: input.text,
        preferences: preferences.output
      })
    );
    trace.push(result.trace);
    message = result.output.message;
    suggestions = result.output.suggestions;
  }

  appendMessage({
    sessionId: input.sessionId,
    role: "assistant",
    content: message,
    agentName: route === "RECOMMEND" ? "Recommendation Agent" : "Zara Orchestrator"
  });

  return {
    route,
    language: nlu.output.language,
    message,
    suggestions,
    upsell,
    cart: getCart(input.sessionId),
    preferences: preferences.output,
    agentTrace: trace
  };
}

function timed<T>(agent: string, input: unknown, fn: () => T): { output: T; trace: AgentTraceStep } {
  const started = performance.now();
  const output = fn();
  return {
    output,
    trace: {
      agent,
      input,
      output,
      latencyMs: Math.round(performance.now() - started)
    }
  };
}
