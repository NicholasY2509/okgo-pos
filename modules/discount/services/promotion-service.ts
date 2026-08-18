import { PromotionInput, PromotionSchedule, PromotionCondition, PromotionReward } from "../schemas/promotion";
import { PromotionRepository } from "../repositories/promotion-repository";
import { prisma } from "@/lib/prisma";

export interface CartItem {
  id?: string;
  serviceId?: string;
  quantity: number;
  unitPrice: number;
  // other fields not needed for evaluation
}

export class PromotionService {
  static async getPromotions() {
    return await PromotionRepository.getPromotions();
  }

  static async getPromotion(id: string) {
    return await PromotionRepository.getPromotion(id);
  }

  static async createPromotion(data: PromotionInput) {
    return await PromotionRepository.createPromotion(data);
  }

  static async updatePromotion(id: string, data: PromotionInput) {
    return await PromotionRepository.updatePromotion(id, data);
  }

  static async deletePromotion(id: string) {
    return await PromotionRepository.deletePromotion(id);
  }

  static async getEligiblePromotions(cartItems: CartItem[], branchId: string) {
    const activePromos = await PromotionRepository.getActivePromotions(branchId);
    
    const now = new Date();
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const currentDay = days[now.getDay()];
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMinute = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;

    const eligiblePromos = [];

    for (const promo of activePromos) {
      const schedules = promo.schedules as unknown as PromotionSchedule[];
      const conditions = promo.conditions as unknown as PromotionCondition | null;
      const reward = promo.reward as unknown as PromotionReward;

      // 1. Check schedule
      const isScheduleValid = schedules.some(schedule => {
        return schedule.days.includes(currentDay as any) &&
               currentTime >= schedule.startTime &&
               currentTime <= schedule.endTime;
      });

      if (!isScheduleValid) continue;

      // 2. Check conditions
      let isValidCondition = true;
      if (conditions) {
        // minQuantity check
        if (conditions.minQuantity) {
          const totalCartQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
          if (totalCartQuantity < conditions.minQuantity) {
            isValidCondition = false;
          }
        }
        
        // requiredServiceIds check
        if (isValidCondition && conditions.requiredServiceIds && conditions.requiredServiceIds.length > 0) {
          const cartServiceIds = cartItems.map(item => item.serviceId).filter(Boolean);
          const hasRequiredService = conditions.requiredServiceIds.some(reqId => cartServiceIds.includes(reqId));
          if (!hasRequiredService) {
            isValidCondition = false;
          }
        }
      }

      if (!isValidCondition) continue;

      // Calculate potential value for UI display
      let potentialDiscountValue = 0;
      if (reward.type === "PERCENTAGE_TOTAL" && reward.value) {
        const subtotal = cartItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
        potentialDiscountValue = subtotal * (reward.value / 100);
      } else if (reward.type === "FREE_ADDON" && reward.addonServiceId) {
        const product = await prisma.product.findUnique({ where: { id: reward.addonServiceId } });
        if (product) {
          potentialDiscountValue = Number(product.price);
        }
      }

      eligiblePromos.push({
        promoId: promo.id,
        name: promo.name,
        rewardType: reward.type,
        potentialDiscountValue
      });
    }

    return eligiblePromos;
  }
}
