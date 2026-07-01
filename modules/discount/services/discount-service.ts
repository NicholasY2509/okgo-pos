import { DiscountInput } from "../schemas/discount";
import { DiscountRepository } from "../repositories/discount-repository";

export class DiscountService {
  static async getDiscounts() {
    return await DiscountRepository.getDiscounts();
  }

  static async getDiscount(id: string) {
    return await DiscountRepository.getDiscount(id);
  }

  static async createDiscount(data: DiscountInput) {
    return await DiscountRepository.createDiscount(data);
  }

  static async updateDiscount(id: string, data: DiscountInput) {
    return await DiscountRepository.updateDiscount(id, data);
  }

  static async deleteDiscount(id: string) {
    return await DiscountRepository.deleteDiscount(id);
  }

  static async getApplicableDiscount(branchId: string): Promise<number> {
    const now = new Date();
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const currentDay = days[now.getDay()];
    
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMinute = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;

    const activeDiscounts = await DiscountRepository.getActiveDiscountsByDay(branchId, currentDay);

    let highestPercentage = 0;

    for (const discount of activeDiscounts) {
      if (currentTime >= discount.startTime && currentTime <= discount.endTime) {
        const perc = Number(discount.percentage);
        if (perc > highestPercentage) {
          highestPercentage = perc;
        }
      }
    }

    return highestPercentage;
  }
}
