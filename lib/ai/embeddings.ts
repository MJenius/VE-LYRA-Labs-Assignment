const VECTOR_SIZE = 96;

const synonymMap: Record<string, string[]> = {
  spicy: ["spicy", "hot", "chilli", "chili", "pepper", "masala", "andhra", "teekha", "kara", "spice"],
  light: ["light", "snack", "healthy", "low", "lite", "konchem", "small", "quick"],
  filling: ["filling", "heavy", "meal", "main", "bowl", "biryani", "combo", "shareable"],
  tangy: ["tangy", "lime", "lemon", "kokum", "chaat", "sour", "chatpata"],
  sweet: ["sweet", "dessert", "cake", "pudding", "jamun", "meetha"],
  beverage: ["drink", "drinks", "beverage", "cooler", "spritz", "chaas", "coffee"],
  veg: ["veg", "vegetarian", "paneer", "mushroom", "tofu", "vegan"],
  nonveg: ["nonveg", "non-veg", "chicken", "fish", "prawn", "meat"],
  dairy: ["dairy", "milk", "cream", "butter", "cheese", "paneer", "raita"],
  bread: ["bread", "naan", "roti"],
  rice: ["rice", "biryani", "khichdi"]
};

export function tokenize(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .replace(/non veg/g, "non-veg")
    .replace(/chahiye/g, "want")
    .replace(/kaadu/g, "not")
    .replace(/undali/g, "want")
    .replace(/thoda|konchem/g, "light")
    .replace(/kuch|sumthing/g, "something")
    .replace(/[^a-z0-9\- ]/g, " ");

  const baseTokens = normalized.split(/\s+/).filter(Boolean);
  const expanded = new Set(baseTokens);

  for (const token of baseTokens) {
    for (const [canonical, synonyms] of Object.entries(synonymMap)) {
      if (synonyms.includes(token)) {
        expanded.add(canonical);
        for (const synonym of synonyms) expanded.add(synonym);
      }
    }
  }

  return [...expanded];
}

function hashToken(token: string): number {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export function embedText(text: string): number[] {
  const vector = Array.from({ length: VECTOR_SIZE }, () => 0);
  const tokens = tokenize(text);

  for (const token of tokens) {
    const index = hashToken(token) % VECTOR_SIZE;
    vector[index] += token.length > 5 ? 1.35 : 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}

export function cosineSimilarity(left: number[], right: number[]): number {
  return left.reduce((sum, value, index) => sum + value * (right[index] ?? 0), 0);
}
