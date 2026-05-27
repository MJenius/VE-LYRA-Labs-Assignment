import type { CartItemRecord, Message, Order, TableSession } from "@/lib/domain/types";

interface DemoStore {
  sessions: Map<string, TableSession>;
  cartItems: Map<string, CartItemRecord[]>;
  messages: Map<string, Message[]>;
  orders: Map<string, Order>;
  otp: Map<string, { code: string; expiresAt: number; attempts: number }>;
}

const globalStore = globalThis as typeof globalThis & {
  __smartDiningStore?: DemoStore;
};

function createStore(): DemoStore {
  return {
    sessions: new Map(),
    cartItems: new Map(),
    messages: new Map(),
    orders: new Map(),
    otp: new Map()
  };
}

export function getDemoStore(): DemoStore {
  if (!globalStore.__smartDiningStore) {
    globalStore.__smartDiningStore = createStore();
  }

  return globalStore.__smartDiningStore;
}

export function resetDemoStore(): void {
  globalStore.__smartDiningStore = createStore();
}

export function createId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${random}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function addHours(date: Date, hours: number): string {
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString();
}
