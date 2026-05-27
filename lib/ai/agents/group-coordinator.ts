import { runRecommendationAgent } from "@/lib/ai/agents/recommendation";
import type { Recommendation, UserPreferences } from "@/lib/domain/types";

export function runGroupCoordinatorAgent(input: {
  sessionId: string;
  query: string;
  preferences: UserPreferences;
}): { message: string; suggestions: Recommendation[] } {
  const groupSize = input.preferences.groupSize ?? 4;
  const response = runRecommendationAgent({
    sessionId: input.sessionId,
    query: `${input.query} shareable group veg non-veg`,
    preferences: {
      ...input.preferences,
      groupSize
    },
    limit: 4
  });

  return {
    message: `For ${groupSize} people, I would split the order across shareable starters, one filling main, and drinks.`,
    suggestions: response.suggestions
  };
}
