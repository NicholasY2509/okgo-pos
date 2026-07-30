"use server";

import { revalidatePath } from "next/cache";
import { brandSettingSchema, type BrandSettingInput } from "../schemas/brand-setting";
import { BrandSettingService } from "../services/brand-setting-service";

export async function updateBrandSettingAction(values: BrandSettingInput) {
  try {
    const validatedFields = brandSettingSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    const result = await BrandSettingService.update(validatedFields.data);

    revalidatePath("/admin/brand-settings");

    return { success: true, data: result };
  } catch (error) {
    return { error: "An unexpected error occurred." };
  }
}

export async function getBrandSettingAction() {
  try {
    const result = await BrandSettingService.get();
    return { success: true, data: result };
  } catch (error) {
    return { error: "Failed to get brand setting." };
  }
}

