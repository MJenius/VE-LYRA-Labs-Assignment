import { describe, expect, it } from "vitest";
import { menuItems } from "@/lib/data/menu";
import { searchMenuSemantically } from "@/lib/ai/rag";

describe("RAG menu retrieval", () => {
  it("grounds spicy light non-veg requests in available menu items", () => {
    const results = searchMenuSemantically({
      query: "something spicy but light non veg",
      topK: 3,
      preferences: { spicy: true, light: true, nonVegetarian: true },
      cartItemIds: []
    });

    expect(results).toHaveLength(3);
    expect(results.every((result) => result.item.available)).toBe(true);
    expect(results.some((result) => result.item.tags.includes("spicy"))).toBe(true);
    expect(results.some((result) => result.item.tags.includes("non-veg"))).toBe(true);
  });

  it("filters allergens and never returns items already in the cart", () => {
    const dairyItem = menuItems.find((item) => item.allergens.includes("dairy"));
    expect(dairyItem).toBeDefined();

    const results = searchMenuSemantically({
      query: "creamy paneer snack",
      topK: 8,
      preferences: { excludeAllergens: ["dairy"] },
      cartItemIds: dairyItem ? [dairyItem.id] : []
    });

    expect(results.every((result) => !result.item.allergens.includes("dairy"))).toBe(true);
    expect(results.every((result) => result.item.id !== dairyItem?.id)).toBe(true);
  });
});
