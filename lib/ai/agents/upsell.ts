import { getMenuItemById, getPopularItems } from "@/lib/data/menu";
import type { CartSnapshot, MenuItem, UpsellSuggestion } from "@/lib/domain/types";

export function runUpsellAgent(input: { cart: CartSnapshot; addedItem?: MenuItem }): UpsellSuggestion | undefined {
  const cartItemIds = new Set(input.cart.items.map((line) => line.menuItemId));

  if (input.addedItem) {
    const complement = input.addedItem.complementaryItemIds
      .map((id) => getMenuItemById(id))
      .find((item): item is MenuItem => Boolean(item?.available && !cartItemIds.has(item.id)));

    if (complement) {
      return {
        trigger: "COMPLEMENT",
        message: `Great choice. Most tables pair ${input.addedItem.name} with ${complement.name}; it fits the cart without feeling pushy.`,
        itemId: complement.id,
        name: complement.name,
        price: complement.price,
        imageUrl: complement.imageUrl
      };
    }
  }

  const hasMain = input.cart.items.some((line) => line.item.tags.includes("main"));
  const hasBeverage = input.cart.items.some((line) => line.item.tags.includes("beverage"));
  if (hasMain && !hasBeverage) {
    const beverage = getPopularItems(10).find((item) => item.tags.includes("beverage") && !cartItemIds.has(item.id));
    if (beverage) {
      return {
        trigger: "MISSING_BEVERAGE",
        message: `Looks like the table has mains but no drinks. ${beverage.name} is quick and balances the order.`,
        itemId: beverage.id,
        name: beverage.name,
        price: beverage.price,
        imageUrl: beverage.imageUrl
      };
    }
  }

  if (input.cart.subtotal >= 420 && input.cart.subtotal < 520) {
    const dealItem = getMenuItemById("m-016");
    if (dealItem && !cartItemIds.has(dealItem.id)) {
      return {
        trigger: "COMBO_THRESHOLD",
        message: `You are close to a better shared spread. ${dealItem.name} unlocks a stronger group order.`,
        itemId: dealItem.id,
        name: dealItem.name,
        price: dealItem.price,
        imageUrl: dealItem.imageUrl
      };
    }
  }

  return undefined;
}
