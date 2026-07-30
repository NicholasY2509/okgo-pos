import { prisma } from "@/lib/prisma";
import { BrandSettingInput } from "../schemas/brand-setting";

export const BrandSettingRepository = {
  async get() {
    return await prisma.brandSetting.findFirst();
  },

  async upsert(data: BrandSettingInput) {
    const existing = await prisma.brandSetting.findFirst();

    if (existing) {
      return await prisma.brandSetting.update({
        where: { id: existing.id },
        data,
      });
    }

    return await prisma.brandSetting.create({
      data,
    });
  },
};
