import { prisma } from "@/lib/prisma";
import { MarketingSettingInput } from "../schemas/marketing-setting";

export const MarketingSettingRepository = {
  async get() {
    return await prisma.marketingSetting.findFirst();
  },

  async upsert(data: MarketingSettingInput) {
    const existing = await prisma.marketingSetting.findFirst();

    if (existing) {
      return await prisma.marketingSetting.update({
        where: { id: existing.id },
        data: {
          isMaintenanceMode: data.isMaintenanceMode,
        },
      });
    }

    return await prisma.marketingSetting.create({
      data: {
        isMaintenanceMode: data.isMaintenanceMode,
      },
    });
  },
};
