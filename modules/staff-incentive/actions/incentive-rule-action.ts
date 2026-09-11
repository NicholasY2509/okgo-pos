"use server";

import { incentiveRuleSchema, IncentiveRuleInput } from "../schemas/incentive-rule";
import { IncentiveRuleService } from "../services/incentive-rule-service";
import { revalidatePath } from "next/cache";

export async function getIncentiveRulesAction() {
  try {
    const data = await IncentiveRuleService.getRules();
    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to fetch incentive rules:", error);
    return { error: "Gagal mengambil data aturan insentif." };
  }
}

export async function createIncentiveRuleAction(values: IncentiveRuleInput) {
  try {
    const validatedFields = incentiveRuleSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." };
    }

    const result = await IncentiveRuleService.createRule(validatedFields.data);
    revalidatePath("/admin/incentives");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Failed to create incentive rule:", error);
    return { error: `Terjadi kesalahan saat menyimpan data: ${error.message}` };
  }
}

export async function updateIncentiveRuleAction(id: string, values: IncentiveRuleInput) {
  try {
    const validatedFields = incentiveRuleSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." };
    }

    const result = await IncentiveRuleService.updateRule(id, validatedFields.data);
    revalidatePath("/admin/incentives");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Failed to update incentive rule:", error);
    return { error: `Terjadi kesalahan saat memperbarui data: ${error.message}` };
  }
}

export async function deleteIncentiveRuleAction(id: string) {
  try {
    await IncentiveRuleService.deleteRule(id);
    revalidatePath("/admin/incentives");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete incentive rule:", error);
    return { error: "Terjadi kesalahan saat menghapus data." };
  }
}
