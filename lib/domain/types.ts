export type LanguageMode = "english" | "hinglish" | "telugu-english";

export type Intent =
  | "GREET"
  | "RECOMMEND"
  | "ADD_ITEM"
  | "UPSELL_CHECK"
  | "GROUP_MERGE"
  | "CHECKOUT"
  | "FALLBACK";

export type SessionStatus = "active" | "ordered" | "closed";
export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED";

export interface UserPreferences {
  spicy?: boolean;
  light?: boolean;
  filling?: boolean;
  vegetarian?: boolean;
  nonVegetarian?: boolean;
  skipDessert?: boolean;
  mealType?: "starter" | "main" | "dessert" | "beverage" | "snack" | "combo";
  excludeAllergens?: string[];
  groupSize?: number;
  language?: LanguageMode;
  mood?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  tags: string[];
  allergens: string[];
  available: boolean;
  popularScore: number;
  complementaryItemIds: string[];
  calories: number;
  prepTimeMinutes: number;
  taxRate: 0.05 | 0.12;
}

export interface TableSession {
  id: string;
  tableId: string;
  status: SessionStatus;
  preferences: UserPreferences;
  conversationSummary: string;
  createdAt: string;
  expiresAt: string;
  activeUsers: string[];
}

export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  agentName?: string;
  createdAt: string;
}

export interface CartItemRecord {
  id: string;
  sessionId: string;
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartLine extends CartItemRecord {
  item: MenuItem;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

export interface CartSnapshot {
  sessionId: string;
  items: CartLine[];
  subtotal: number;
  tax: number;
  total: number;
  totalQuantity: number;
}

export interface Recommendation {
  itemId: string;
  name: string;
  price: number;
  reason: string;
  score: number;
  imageUrl: string;
  tags: string[];
  allergens: string[];
  calories: number;
}

export interface SearchResult {
  item: MenuItem;
  score: number;
  matchedSignals: string[];
}

export interface NluResult {
  rawText: string;
  normalizedText: string;
  intent: Intent;
  language: LanguageMode;
  preferences: UserPreferences;
  itemQuery?: string;
}

export interface UpsellSuggestion {
  trigger: "COMPLEMENT" | "MISSING_BEVERAGE" | "COMBO_THRESHOLD" | "LAST_CALL" | "EVENING_SPECIAL";
  message: string;
  itemId: string;
  name: string;
  price: number;
  imageUrl: string;
}

export interface AgentTraceStep {
  agent: string;
  input: unknown;
  output: unknown;
  latencyMs: number;
}

export interface OrchestratorResponse {
  route: Intent;
  language: LanguageMode;
  message: string;
  suggestions: Recommendation[];
  upsell?: UpsellSuggestion;
  cart: CartSnapshot;
  preferences: UserPreferences;
  agentTrace: AgentTraceStep[];
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  sessionId: string;
  customerName: string;
  customerPhoneHash: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  estimatedWaitMinutes: number;
  createdAt: string;
}
