import type { Intent, LanguageMode, NluResult, UserPreferences } from "@/lib/domain/types";

const hinglishMarkers = ["chahiye", "mujhe", "kuch", "thoda", "hai", "nahi", "achha", "batao", "daal"];
const teluguEnglishMarkers = ["konchem", "undali", "kaadu", "bagundi", "ivvu", "tinu"];
const allergenWords = ["dairy", "nuts", "gluten", "fish", "shellfish", "soy", "sesame"];

export function analyzeUserMessage(text: string, existing: UserPreferences = {}): NluResult {
  const normalizedText = text.trim().toLowerCase();
  const language = detectLanguage(normalizedText);
  const preferences = extractPreferences(normalizedText, existing, language);
  const intent = classifyIntent(normalizedText);
  const itemQuery = extractItemQuery(normalizedText, intent);

  return {
    rawText: text,
    normalizedText,
    intent,
    language,
    preferences,
    itemQuery
  };
}

function detectLanguage(text: string): LanguageMode {
  if (teluguEnglishMarkers.some((marker) => text.includes(marker))) return "telugu-english";
  if (hinglishMarkers.some((marker) => text.includes(marker))) return "hinglish";
  return "english";
}

function classifyIntent(text: string): Intent {
  if (/^(hi|hello|hey|start|namaste)\b/.test(text)) return "GREET";
  if (/\b(place order|checkout|bill|otp|pay|that's all|thats all)\b/.test(text)) return "CHECKOUT";
  if (/\b(add|include|put|daal|dalo|cart)\b/.test(text)) return "ADD_ITEM";
  if (/\b(we are|we're|our|group|people|share|everyone|hum)\b/.test(text)) return "GROUP_MERGE";
  if (/\b(pair|goes well|with this|combo|deal)\b/.test(text)) return "UPSELL_CHECK";
  if (
    /\b(spicy|light|snack|starter|main|dessert|drink|best|recommend|suggest|veg|non-veg|hungry|sweet|chahiye|undali|kaadu)\b/.test(
      text
    )
  ) {
    return "RECOMMEND";
  }
  return "FALLBACK";
}

function extractPreferences(text: string, existing: UserPreferences, language: LanguageMode): UserPreferences {
  const next: UserPreferences = {
    ...existing,
    excludeAllergens: [...(existing.excludeAllergens ?? [])],
    language
  };

  if (/\b(spicy|teekha|hot|chilli|andhra|pepper|kara)\b/.test(text)) next.spicy = true;
  if (/\b(light|snack|konchem|thoda|not heavy|lite|quick)\b/.test(text)) next.light = true;
  if (/\b(filling|heavy|hungry|proper meal|main)\b/.test(text)) next.filling = true;
  if (/\b(veg|vegetarian|vegan)\b/.test(text) && !/\b(non-veg|non veg|kaadu)\b/.test(text)) {
    next.vegetarian = true;
    next.nonVegetarian = false;
  }
  if (/\b(non-veg|non veg|chicken|fish|prawn|meat|veg kaadu)\b/.test(text)) {
    next.nonVegetarian = true;
    next.vegetarian = false;
  }
  if (/\b(no dessert|skip dessert|without dessert)\b/.test(text)) next.skipDessert = true;
  if (/\b(starter|snack)\b/.test(text)) next.mealType = "starter";
  if (/\b(main|meal|biryani|rice|bowl)\b/.test(text)) next.mealType = "main";
  if (/\b(dessert|sweet|meetha)\b/.test(text)) next.mealType = "dessert";
  if (/\b(drink|drinks|beverage|cooler|chaas|coffee)\b/.test(text)) next.mealType = "beverage";

  const groupMatch = text.match(/\b([2-9])\s*(people|persons|diners|members)\b/);
  if (groupMatch?.[1]) next.groupSize = Number(groupMatch[1]);

  for (const allergen of allergenWords) {
    if (text.includes(allergen) && /\b(allergy|allergic|avoid|no|without|se allergy)\b/.test(text)) {
      next.excludeAllergens = Array.from(new Set([...(next.excludeAllergens ?? []), allergen]));
    }
  }

  return next;
}

function extractItemQuery(text: string, intent: Intent): string | undefined {
  if (intent !== "ADD_ITEM") return undefined;

  return text
    .replace(/\b(add|include|put|please|pls|to|our|my|order|cart|daal|dalo|karo)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
