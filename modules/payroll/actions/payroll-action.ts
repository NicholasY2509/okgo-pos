"use server";

import { GenerateBatchPayrollSchema, UpdatePayrollItemSchema, type GenerateBatchPayrollInput, type UpdatePayrollItemInput } from "../schemas/payroll";
import { PayrollEngine } from "../services/payroll-engine";
import { PayrollUIService } from "../services/payroll-ui-service";
import { StaffService } from "@/modules/staff/services/staff-service";
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service";
import { revalidatePath } from "next/cache";

export async function generateBatchPayrollAction(values: GenerateBatchPayrollInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth();
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    const validatedFields = GenerateBatchPayrollSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    const { monthPeriod, startDate, endDate } = validatedFields.data;
    
    const staffs = await StaffService.getActiveStaffIds();
    
    for (const staff of staffs) {
      await PayrollEngine.generatePayroll({
        staffId: staff.id,
        monthPeriod,
        startDate,
        endDate,
      });
    }

    revalidatePath("/admin/payroll");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { error: message };
  }
}

export async function addPayrollItemAction(values: UpdatePayrollItemInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth();
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    const validatedFields = UpdatePayrollItemSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    await PayrollUIService.updatePayrollItem(validatedFields.data);
    revalidatePath("/admin/payroll");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { error: message };
  }
}

export async function getPayrollDetailsAction(id: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth();
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    const data = await PayrollUIService.getPayrollById(id);
    return { data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch payroll details.";
    return { error: message };
  }
}

export async function deletePayrollItemAction(itemId: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth();
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    await PayrollUIService.deletePayrollItem(itemId);
    revalidatePath("/admin/payroll");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { error: message };
  }
}

export async function settlePayrollAction(payrollId: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth();
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    await PayrollUIService.settlePayroll(payrollId);
    revalidatePath("/admin/payroll");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { error: message };
  }
}
