"use server";

import { GenerateBatchPayrollSchema, UpdatePayrollItemSchema, type GenerateBatchPayrollInput, type UpdatePayrollItemInput } from "../schemas/payroll";
import { PayrollEngine } from "../services/payroll-engine";
import { PayrollUIService } from "../services/payroll-ui-service";
import { revalidatePath } from "next/cache";

export async function generateBatchPayrollAction(values: GenerateBatchPayrollInput) {
  try {
    const validatedFields = GenerateBatchPayrollSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    const { monthPeriod, startDate, endDate } = validatedFields.data;
    
    // Fetch all active staff
    const { prisma } = await import("@/lib/prisma");
    const staffs = await prisma.staff.findMany({ where: { isActive: true }, select: { id: true } });
    
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
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function addPayrollItemAction(values: UpdatePayrollItemInput) {
  try {
    const validatedFields = UpdatePayrollItemSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    await PayrollUIService.updatePayrollItem(validatedFields.data);
    revalidatePath("/admin/payroll");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function getPayrollDetailsAction(id: string) {
  try {
    const data = await PayrollUIService.getPayrollById(id);
    return { data };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch payroll details." };
  }
}

export async function deletePayrollItemAction(itemId: string) {
  try {
    await PayrollUIService.deletePayrollItem(itemId);
    revalidatePath("/admin/payroll");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function settlePayrollAction(payrollId: string) {
  try {
    await PayrollUIService.settlePayroll(payrollId);
    revalidatePath("/admin/payroll");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}
