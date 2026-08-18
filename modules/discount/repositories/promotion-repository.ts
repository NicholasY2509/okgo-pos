import { prisma } from "@/lib/prisma";
import { PromotionInput } from "../schemas/promotion";
import { Prisma } from "@/lib/generated/prisma";

export const PromotionRepository = {
  async getPromotions() {
    return await prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
      include: { branch: true }
    });
  },

  async getPromotion(id: string) {
    return await prisma.promotion.findUnique({
      where: { id }
    });
  },

  async createPromotion(data: PromotionInput) {
    return await prisma.promotion.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        branchId: data.branchId || null,
        schedules: data.schedules as unknown as Prisma.InputJsonValue,
        conditions: data.conditions ? data.conditions as unknown as Prisma.InputJsonValue : Prisma.JsonNull,
        reward: data.reward as unknown as Prisma.InputJsonValue,
      }
    });
  },

  async updatePromotion(id: string, data: PromotionInput) {
    return await prisma.promotion.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        branchId: data.branchId || null,
        schedules: data.schedules as unknown as Prisma.InputJsonValue,
        conditions: data.conditions ? data.conditions as unknown as Prisma.InputJsonValue : Prisma.JsonNull,
        reward: data.reward as unknown as Prisma.InputJsonValue,
      }
    });
  },

  async deletePromotion(id: string) {
    return await prisma.promotion.delete({
      where: { id }
    });
  },

  async getActivePromotions(branchId: string) {
    return await prisma.promotion.findMany({
      where: {
        isActive: true,
        OR: [
          { branchId: null },
          { branchId: branchId }
        ]
      }
    });
  }
};
