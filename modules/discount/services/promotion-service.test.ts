import { describe, it, expect, vi, beforeEach } from "vitest";
import { PromotionService, CartItem } from "./promotion-service";
import { PromotionRepository } from "../repositories/promotion-repository";

vi.mock("../repositories/promotion-repository", () => ({
  PromotionRepository: {
    getActivePromotions: vi.fn(),
  },
}));

vi.mock("@/modules/product/repositories/product-repository", () => ({
  ProductRepository: {
    getProductById: vi.fn(),
  },
}));

describe("PromotionService - getEligiblePromotions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should evaluate a percentage total discount correctly for eligible cart", async () => {
    const mockPromotion = {
      id: "promo-1",
      name: "Happy Hour 20% Off",
      schedules: [
        {
          days: ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
          startTime: "00:00",
          endTime: "23:59",
        },
      ],
      conditions: {
        minQuantity: 2,
      },
      reward: {
        type: "PERCENTAGE_TOTAL",
        value: 20,
      },
    };

    vi.mocked(PromotionRepository.getActivePromotions).mockResolvedValue([mockPromotion as never]);

    const cartItems: CartItem[] = [
      { serviceId: "srv-1", quantity: 2, unitPrice: 100000 },
      { serviceId: "srv-2", quantity: 1, unitPrice: 50000 },
    ]; // Subtotal = 250,000, Total quantity = 3 >= 2

    const results = await PromotionService.getEligiblePromotions(cartItems, "branch-1");

    expect(results).toHaveLength(1);
    expect(results[0].isEligible).toBe(true);
    expect(results[0].potentialDiscountValue).toBe(50000); // 20% of 250,000 = 50,000
  });

  it("should mark promotion as ineligible when minQuantity is not met", async () => {
    const mockPromotion = {
      id: "promo-2",
      name: "Buy 3 Get Discount",
      schedules: [
        {
          days: ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
          startTime: "00:00",
          endTime: "23:59",
        },
      ],
      conditions: {
        minQuantity: 3,
      },
      reward: {
        type: "PERCENTAGE_TOTAL",
        value: 10,
      },
    };

    vi.mocked(PromotionRepository.getActivePromotions).mockResolvedValue([mockPromotion as never]);

    const cartItems: CartItem[] = [
      { serviceId: "srv-1", quantity: 1, unitPrice: 100000 },
    ]; // Total quantity = 1 < 3

    const results = await PromotionService.getEligiblePromotions(cartItems, "branch-1");

    expect(results).toHaveLength(1);
    expect(results[0].isEligible).toBe(false);
    expect(results[0].ineligibilityReason).toContain("Minimal pembelian 3 layanan");
  });
});
