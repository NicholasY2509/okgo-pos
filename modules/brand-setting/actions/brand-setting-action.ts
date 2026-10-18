"use server";

import { revalidatePath } from "next/cache";
import { brandSettingSchema, type BrandSettingInput } from "../schemas/brand-setting";
import { BrandSettingService } from "../services/brand-setting-service";
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service";

export async function updateBrandSettingAction(values: BrandSettingInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"]);
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    const validatedFields = brandSettingSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    const result = await BrandSettingService.update(validatedFields.data);

    revalidatePath("/admin/brand-settings");

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("Failed to update brand setting:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function getBrandSettingAction() {
  try {
    const result = await BrandSettingService.get();
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: unknown) {
    console.error("Failed to get brand setting:", error);
    return { error: "Failed to get brand setting." };
  }
}
