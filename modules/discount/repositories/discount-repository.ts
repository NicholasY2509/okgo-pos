import { prisma } from "@/lib/prisma";
import { DiscountInput } from "../schemas/discount";

export const DiscountRepository = {
  async getDiscounts() {
    return await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' },
      include: { branch: true }
    });
  },

  async getDiscount(id: string) {
    return await prisma.discount.findUnique({
      where: { id }
    });
  },

  async createDiscount(data: DiscountInput) {
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
  },

  async updateDiscount(id: string, data: DiscountInput) {
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
  },

  async deleteDiscount(id: string) {
    return await prisma.discount.delete({
      where: { id }
    });
  },

  async getActiveDiscountsByDay(branchId: string, dayOfWeek: string) {
    return await prisma.discount.findMany({
      where: {
        isActive: true,
        dayOfWeek: dayOfWeek,
        OR: [
          { branchId: null },
          { branchId: branchId }
        ]
      }
    });
  }
};
