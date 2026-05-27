import { getMenuItemById } from "@/lib/data/menu";
import { createId, getDemoStore, nowIso } from "@/lib/data/store";
import type { CartItemRecord, CartSnapshot } from "@/lib/domain/types";
import { getSession } from "@/lib/services/session";

interface AddCartInput {
  itemId: string;
  quantity: number;
  addedBy: string;
  specialInstructions?: string;
}

export function getCart(sessionId: string): CartSnapshot {
  getSession(sessionId);
  const records = getDemoStore().cartItems.get(sessionId) ?? [];
  const items = records.map((record) => {
    const item = getMenuItemById(record.menuItemId);
    if (!item) throw new Error(`Menu item not found: ${record.menuItemId}`);

    const lineSubtotal = roundMoney(item.price * record.quantity);
    const lineTax = roundMoney(lineSubtotal * item.taxRate);

    return {
      ...record,
      item,
      lineSubtotal,
      lineTax,
      lineTotal: roundMoney(lineSubtotal + lineTax)
    };
  });

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineSubtotal, 0));
  const tax = roundMoney(items.reduce((sum, item) => sum + item.lineTax, 0));

  return {
    sessionId,
    items,
    subtotal,
    tax,
    total: roundMoney(subtotal + tax),
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0)
  };
}

export function addCartItem(
  sessionId: string,
  input: AddCartInput
): { cartItem: CartItemRecord; cart: CartSnapshot } {
  getSession(sessionId);
  const item = getMenuItemById(input.itemId);
  if (!item) throw new Error(`Menu item not found: ${input.itemId}`);
  if (!item.available) throw new Error(`${item.name} is currently unavailable`);
  if (input.quantity < 1) throw new Error("Quantity must be at least 1");

  const store = getDemoStore();
  const existingRecords = store.cartItems.get(sessionId) ?? [];
  const sameLine = existingRecords.find(
    (record) =>
      record.menuItemId === input.itemId &&
      (record.specialInstructions ?? "") === (input.specialInstructions ?? "")
  );

  let cartItem: CartItemRecord;
  if (sameLine) {
    cartItem = {
      ...sameLine,
      quantity: sameLine.quantity + input.quantity,
      addedBy: sameLine.addedBy || input.addedBy,
      updatedAt: nowIso()
    };
    store.cartItems.set(
      sessionId,
      existingRecords.map((record) => (record.id === sameLine.id ? cartItem : record))
    );
  } else {
    cartItem = {
      id: createId("cart"),
      sessionId,
      menuItemId: input.itemId,
      quantity: input.quantity,
      specialInstructions: input.specialInstructions,
      addedBy: input.addedBy,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    store.cartItems.set(sessionId, [...existingRecords, cartItem]);
  }

  return { cartItem, cart: getCart(sessionId) };
}

export function updateCartItem(
  sessionId: string,
  cartItemId: string,
  patch: { quantity?: number; specialInstructions?: string }
): CartSnapshot {
  getSession(sessionId);
  const store = getDemoStore();
  const records = store.cartItems.get(sessionId) ?? [];
  const target = records.find((record) => record.id === cartItemId);
  if (!target) throw new Error(`Cart item not found: ${cartItemId}`);

  if (patch.quantity !== undefined && patch.quantity < 1) {
    return removeCartItem(sessionId, cartItemId);
  }

  store.cartItems.set(
    sessionId,
    records.map((record) =>
      record.id === cartItemId
        ? {
            ...record,
            quantity: patch.quantity ?? record.quantity,
            specialInstructions: patch.specialInstructions ?? record.specialInstructions,
            updatedAt: nowIso()
          }
        : record
    )
  );

  return getCart(sessionId);
}

export function removeCartItem(sessionId: string, cartItemId: string): CartSnapshot {
  getSession(sessionId);
  const store = getDemoStore();
  store.cartItems.set(
    sessionId,
    (store.cartItems.get(sessionId) ?? []).filter((record) => record.id !== cartItemId)
  );
  return getCart(sessionId);
}

export function clearCart(sessionId: string): void {
  getDemoStore().cartItems.set(sessionId, []);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
