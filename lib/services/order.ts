import { createId, getDemoStore, nowIso } from "@/lib/data/store";
import type { Order } from "@/lib/domain/types";
import { getCart } from "@/lib/services/cart";
import { markSessionOrdered } from "@/lib/services/session";

interface CreateOrderInput {
  sessionId: string;
  customerName: string;
  customerPhone: string;
}

export function createOrderAfterValidation(input: CreateOrderInput): Order {
  if (input.customerName.trim().length < 2) throw new Error("Customer name is required");
  if (!/^\+?[0-9]{10,15}$/.test(input.customerPhone)) throw new Error("Valid phone number is required");

  const cart = getCart(input.sessionId);
  if (cart.items.length === 0) throw new Error("Cart is empty");

  const unavailable = cart.items.find((line) => !line.item.available);
  if (unavailable) throw new Error(`${unavailable.item.name} is unavailable`);

  const order: Order = {
    id: createId("ord"),
    sessionId: input.sessionId,
    customerName: input.customerName.trim(),
    customerPhoneHash: hashPhone(input.customerPhone),
    status: "PENDING",
    items: cart.items.map((line) => ({
      menuItemId: line.menuItemId,
      name: line.item.name,
      quantity: line.quantity,
      price: line.item.price,
      specialInstructions: line.specialInstructions
    })),
    subtotal: cart.subtotal,
    taxAmount: cart.tax,
    totalAmount: cart.total,
    estimatedWaitMinutes: estimateWait(cart.items.map((line) => line.item.prepTimeMinutes)),
    createdAt: nowIso()
  };

  getDemoStore().orders.set(order.id, order);
  markSessionOrdered(input.sessionId);
  return order;
}

export function getOrder(orderId: string): Order {
  const order = getDemoStore().orders.get(orderId);
  if (!order) throw new Error(`Order not found: ${orderId}`);
  return order;
}

function estimateWait(prepTimes: number[]): number {
  return Math.max(12, Math.min(35, Math.ceil(Math.max(...prepTimes) + prepTimes.length * 2)));
}

function hashPhone(phone: string): string {
  let hash = 0;
  for (let index = 0; index < phone.length; index += 1) {
    hash = Math.imul(31, hash) + phone.charCodeAt(index);
  }
  return `phone_${Math.abs(hash).toString(16)}`;
}
