"use server";

import { revalidatePath } from "next/cache";
import { marketingSettingSchema, type MarketingSettingInput } from "../schemas/marketing-setting";
import { MarketingSettingService } from "../services/marketing-setting-service";

export async function updateMarketingSettingAction(values: MarketingSettingInput) {
  try {
    const validated = marketingSettingSchema.safeParse(values);
    if (!validated.success) {
      return { error: "Data pengaturan tidak valid." };
    }

    const result = await MarketingSettingService.update(validated.data);
    revalidatePath("/");
    revalidatePath("/admin/brand-settings");
    revalidatePath("/admin/marketing");

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to update marketing setting:", error);
    return { error: "Terjadi kesalahan saat memperbarui status pemeliharaan." };
  }
}

export async function getMarketingSettingAction() {
  try {
    const result = await MarketingSettingService.get();
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to get marketing setting:", error);
    return { error: "Gagal memuat pengaturan pemasaran." };
  }
}
