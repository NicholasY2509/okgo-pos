"use server";

import { incentiveRuleSchema, IncentiveRuleInput } from "../schemas/incentive-rule";
import { IncentiveRuleService } from "../services/incentive-rule-service";
import { revalidatePath } from "next/cache";
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service";

export async function getIncentiveRulesAction() {
  try {
    const authCheck = await AuthGuardService.requireAuth();
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    const data = await IncentiveRuleService.getRules();
    return { success: true, data };
  } catch (error: unknown) {
    console.error("Failed to fetch incentive rules:", error);
    return { error: "Gagal mengambil data aturan insentif." };
  }
}

export async function createIncentiveRuleAction(values: IncentiveRuleInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"]);
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    const validatedFields = incentiveRuleSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." };
    }

    const result = await IncentiveRuleService.createRule(validatedFields.data);
    revalidatePath("/admin/incentives");
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("Failed to create incentive rule:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return { error: `Terjadi kesalahan saat menyimpan data: ${message}` };
  }
}

export async function updateIncentiveRuleAction(id: string, values: IncentiveRuleInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"]);
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    const validatedFields = incentiveRuleSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." };
    }

    const result = await IncentiveRuleService.updateRule(id, validatedFields.data);
    revalidatePath("/admin/incentives");
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("Failed to update incentive rule:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return { error: `Terjadi kesalahan saat memperbarui data: ${message}` };
  }
}

export async function deleteIncentiveRuleAction(id: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"]);
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    await IncentiveRuleService.deleteRule(id);
    revalidatePath("/admin/incentives");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to delete incentive rule:", error);
    return { error: "Terjadi kesalahan saat menghapus data." };
  }
}
