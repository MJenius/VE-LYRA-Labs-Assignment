import { beforeEach, describe, expect, it } from "vitest";
import { menuItems } from "@/lib/data/menu";
import { resetDemoStore } from "@/lib/data/store";
import { addCartItem } from "@/lib/services/cart";
import { createOrderAfterValidation } from "@/lib/services/order";
import { sendOtp, verifyOtp } from "@/lib/services/otp";
import { getOrCreateSession } from "@/lib/services/session";

describe("checkout flow", () => {
  beforeEach(() => resetDemoStore());

  it("uses mock OTP 123456 and creates a validated pending order", () => {
    const session = getOrCreateSession("T3");
    addCartItem(session.id, { itemId: menuItems[0]!.id, quantity: 1, addedBy: "Maya" });

    const sent = sendOtp("+919999999999");
    expect(sent.provider).toBe("mock");
    expect(verifyOtp("+919999999999", "123456").verified).toBe(true);

    const order = createOrderAfterValidation({
      sessionId: session.id,
      customerName: "Maya",
      customerPhone: "+919999999999"
    });

    expect(order.status).toBe("PENDING");
    expect(order.items).toHaveLength(1);
    expect(order.totalAmount).toBeGreaterThan(0);
  });

  it("rejects empty carts before creating an order", () => {
    const session = getOrCreateSession("T5");

    expect(() =>
      createOrderAfterValidation({
        sessionId: session.id,
        customerName: "Empty Cart",
        customerPhone: "+919888888888"
      })
    ).toThrow("Cart is empty");
  });
});
