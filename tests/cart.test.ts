import { beforeEach, describe, expect, it } from "vitest";
import { menuItems } from "@/lib/data/menu";
import { resetDemoStore } from "@/lib/data/store";
import { addCartItem, getCart, removeCartItem, updateCartItem } from "@/lib/services/cart";
import { getOrCreateSession } from "@/lib/services/session";

describe("shared cart service", () => {
  beforeEach(() => resetDemoStore());

  it("creates a table-scoped cart and calculates tax totals", () => {
    const session = getOrCreateSession("T12");
    const item = menuItems[0];

    addCartItem(session.id, { itemId: item.id, quantity: 2, addedBy: "Rahul" });
    const cart = getCart(session.id);

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]?.addedBy).toBe("Rahul");
    expect(cart.subtotal).toBe(item.price * 2);
    expect(cart.tax).toBeGreaterThan(0);
    expect(cart.total).toBe(cart.subtotal + cart.tax);
  });

  it("updates and removes cart items without losing ownership metadata", () => {
    const session = getOrCreateSession("T8");
    const added = addCartItem(session.id, {
      itemId: menuItems[1]!.id,
      quantity: 1,
      addedBy: "Priya",
      specialInstructions: "no onions"
    });

    updateCartItem(session.id, added.cartItem.id, { quantity: 3 });
    expect(getCart(session.id).items[0]?.addedBy).toBe("Priya");
    expect(getCart(session.id).items[0]?.quantity).toBe(3);

    removeCartItem(session.id, added.cartItem.id);
    expect(getCart(session.id).items).toHaveLength(0);
  });
});
