import { prisma } from "@/lib/prisma";
import { IncentiveRuleInput } from "../schemas/incentive-rule";

export const IncentiveRuleRepository = {
  async findMany() {
    return await prisma.incentiveRule.findMany({
      include: {
        tiers: {
          orderBy: { minTarget: "asc" },
        },
        targetWorkPositions: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(data: IncentiveRuleInput) {
    const { id, tiers, targetWorkPositionIds, ...ruleData } = data;
    return await prisma.incentiveRule.create({
      data: {
        ...ruleData,
        targetWorkPositions: {
          connect: targetWorkPositionIds.map(id => ({ id })),
        },
        tiers: {
          create: tiers,
        },
      },
      include: {
        tiers: true,
      },
    });
  },

  async update(id: string, data: IncentiveRuleInput) {
    const { id: _id, tiers, targetWorkPositionIds, ...ruleData } = data;

    // A simple approach for nested updates is to delete all existing tiers and recreate them
    // Alternatively, we can use upsert, but since tiers are completely replaced in the UI usually:
    return await prisma.$transaction(async (tx) => {
      // Delete existing tiers
      await tx.incentiveTier.deleteMany({
        where: { incentiveRuleId: id },
      });

      // Update rule and create new tiers
      return await tx.incentiveRule.update({
        where: { id },
        data: {
          ...ruleData,
          targetWorkPositions: {
            set: targetWorkPositionIds.map(id => ({ id })),
          },
          tiers: {
            create: tiers?.map(tier => {
              const { id, ...tierData } = tier; // omit id when creating
              return tierData;
            }),
          },
        },
        include: {
          tiers: true,
        },
      });
    });
  },

  async delete(id: string) {
    return await prisma.incentiveRule.delete({
      where: { id },
    });
  },
};
