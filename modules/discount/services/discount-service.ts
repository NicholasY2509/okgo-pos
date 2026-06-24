import { prisma } from "@/lib/prisma";
import { DiscountInput } from "../schemas/discount";

export class DiscountService {
  static async getDiscounts() {
    return await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' },
      include: { branch: true }
    });
  }

  static async getDiscount(id: string) {
    return await prisma.discount.findUnique({
      where: { id }
    });
  }

  static async createDiscount(data: DiscountInput) {
    return await prisma.discount.create({
      data: {
        name: data.name,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        percentage: data.percentage,
        isActive: data.isActive,
        branchId: data.branchId || null
      }
    });
  }

  static async updateDiscount(id: string, data: DiscountInput) {
    return await prisma.discount.update({
      where: { id },
      data: {
        name: data.name,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        percentage: data.percentage,
        isActive: data.isActive,
        branchId: data.branchId || null
      }
    });
  }

  static async deleteDiscount(id: string) {
    return await prisma.discount.delete({
      where: { id }
    });
  }

  static async getApplicableDiscount(branchId: string): Promise<number> {
    const now = new Date();
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const currentDay = days[now.getDay()];
    
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMinute = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;

    const activeDiscounts = await prisma.discount.findMany({
      where: {
        isActive: true,
        dayOfWeek: currentDay,
        OR: [
          { branchId: null },
          { branchId: branchId }
        ]
      }
    });

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
