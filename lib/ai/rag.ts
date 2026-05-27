import { cosineSimilarity, embedText, tokenize } from "@/lib/ai/embeddings";
import { menuItems } from "@/lib/data/menu";
import type { MenuItem, SearchResult, UserPreferences } from "@/lib/domain/types";

interface SearchOptions {
  query: string;
  topK: number;
  preferences?: UserPreferences;
  cartItemIds?: string[];
}

const itemVectors = menuItems.map((item) => ({
  item,
  document: buildMenuDocument(item),
  vector: embedText(buildMenuDocument(item))
}));

export function searchMenuSemantically({
  query,
  topK,
  preferences = {},
  cartItemIds = []
}: SearchOptions): SearchResult[] {
  const queryVector = embedText(`${query} ${preferenceQueryBoost(preferences)}`);
  const cartSet = new Set(cartItemIds);

  return itemVectors
    .filter(({ item }) => item.available)
    .filter(({ item }) => !cartSet.has(item.id))
    .filter(({ item }) => respectsHardFilters(item, preferences))
    .map(({ item, document, vector }) => {
      const semanticScore = cosineSimilarity(queryVector, vector);
      const preferenceScore = scorePreferenceFit(item, preferences);
      const matchedSignals = getMatchedSignals(query, document, item, preferences);

      return {
        item,
        score: Number((semanticScore + preferenceScore + item.popularScore * 0.08).toFixed(4)),
        matchedSignals
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function findMenuItemByNaturalLanguage(query: string): MenuItem | undefined {
  const direct = menuItems.find((item) => item.name.toLowerCase() === query.toLowerCase());
  if (direct) return direct;

  const tokenSet = new Set(tokenize(query));
  const exactish = menuItems.find((item) =>
    item.name
      .toLowerCase()
      .split(/\s+/)
      .every((part) => tokenSet.has(part))
  );
  if (exactish) return exactish;

  return searchMenuSemantically({ query, topK: 1 }).at(0)?.item;
}

function buildMenuDocument(item: MenuItem): string {
  return [
    item.name,
    item.category,
    item.description,
    item.tags.join(" "),
    item.allergens.map((allergen) => `contains-${allergen}`).join(" "),
    item.calories < 400 ? "light low calorie" : "filling hearty",
    item.prepTimeMinutes <= 10 ? "quick serve" : ""
  ].join(" ");
}

function respectsHardFilters(item: MenuItem, preferences: UserPreferences): boolean {
  if (preferences.excludeAllergens?.some((allergen) => item.allergens.includes(allergen))) return false;
  if (preferences.vegetarian && !item.tags.includes("veg")) return false;
  if (preferences.nonVegetarian && !item.tags.includes("non-veg")) return false;
  if (preferences.skipDessert && item.tags.includes("dessert")) return false;
  return true;
}

function scorePreferenceFit(item: MenuItem, preferences: UserPreferences): number {
  let score = 0;
  if (preferences.spicy && item.tags.includes("spicy")) score += 0.22;
  if (preferences.light && (item.tags.includes("light") || item.calories <= 420)) score += 0.22;
  if (preferences.filling && (item.tags.includes("filling") || item.calories >= 600)) score += 0.18;
  if (preferences.mealType && item.tags.includes(preferences.mealType)) score += 0.2;
  if (preferences.mealType === "beverage" && item.tags.includes("beverage")) score += 0.35;
  if (preferences.groupSize && preferences.groupSize >= 3 && item.tags.includes("shareable")) score += 0.25;
  return score;
}

function preferenceQueryBoost(preferences: UserPreferences): string {
  return [
    preferences.spicy ? "spicy chilli pepper" : "",
    preferences.light ? "light snack quick low calorie" : "",
    preferences.filling ? "filling main combo rice" : "",
    preferences.vegetarian ? "veg vegetarian" : "",
    preferences.nonVegetarian ? "non-veg chicken fish prawn" : "",
    preferences.mealType ?? ""
  ].join(" ");
}

function getMatchedSignals(
  query: string,
  document: string,
  item: MenuItem,
  preferences: UserPreferences
): string[] {
  const queryTokens = new Set(tokenize(query));
  const documentTokens = new Set(tokenize(document));
  const signals = [...queryTokens].filter((token) => documentTokens.has(token)).slice(0, 4);

  if (preferences.spicy && item.tags.includes("spicy")) signals.push("spicy");
  if (preferences.light && (item.tags.includes("light") || item.calories <= 420)) signals.push("light");
  if (preferences.groupSize && item.tags.includes("shareable")) signals.push("shareable");

  return Array.from(new Set(signals));
}
