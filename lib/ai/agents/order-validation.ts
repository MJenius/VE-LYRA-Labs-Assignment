import { getCart } from "@/lib/services/cart";

export function runOrderValidationAgent(sessionId: string): { valid: true; message: string } {
  const cart = getCart(sessionId);
  if (cart.items.length === 0) throw new Error("Cart is empty");

  const unavailable = cart.items.find((line) => !line.item.available);
  if (unavailable) throw new Error(`${unavailable.item.name} is unavailable`);

  return {
    valid: true,
    message: "Cart validated: all items are available and ready for OTP checkout."
  };
}
