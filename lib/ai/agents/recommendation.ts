import { searchMenuSemantically } from "@/lib/ai/rag";
import type { Recommendation, UserPreferences } from "@/lib/domain/types";
import { getCart } from "@/lib/services/cart";

export function runRecommendationAgent(input: {
  sessionId: string;
  query: string;
  preferences: UserPreferences;
  limit?: number;
}): { message: string; suggestions: Recommendation[] } {
  const cart = getCart(input.sessionId);
  const results = searchMenuSemantically({
    query: input.query,
    topK: input.limit ?? 3,
    preferences: input.preferences,
    cartItemIds: cart.items.map((line) => line.menuItemId)
  });

  const suggestions = results.map(({ item, score, matchedSignals }) => ({
    itemId: item.id,
    name: item.name,
    price: item.price,
    reason: buildReason(item.name, matchedSignals, item.calories, item.prepTimeMinutes),
    score,
    imageUrl: item.imageUrl,
    tags: item.tags,
    allergens: item.allergens,
    calories: item.calories
  }));

  return {
    message: responseIntro(input.preferences.language ?? "english", suggestions.length),
    suggestions
  };
}

function buildReason(name: string, signals: string[], calories: number, prepTime: number): string {
  const signalText = signals.length > 0 ? signals.slice(0, 2).join(" + ") : "popular match";
  const lightText = calories <= 420 ? "not too heavy" : "properly satisfying";
  return `${name} matches ${signalText}, is ${lightText}, and takes about ${prepTime} min.`;
}

function responseIntro(language: string, count: number): string {
  if (count === 0) return "I could not find a safe match in the current menu. Try relaxing one filter.";
  if (language === "hinglish") return "Bilkul. I found grounded picks from the live menu for you.";
  if (language === "telugu-english") return "Sure, live menu nunchi best matches teesukochaanu.";
  return "Here are the best grounded picks from the live menu.";
}
