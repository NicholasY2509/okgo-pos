"use server"

import { revalidatePath } from "next/cache"
import { 
  salaryComponentSchema, 
  updateSalaryComponentSchema, 
  type SalaryComponentInput, 
  type UpdateSalaryComponentInput 
} from "../schemas/salary-component"
import { SalaryComponentService } from "../services/salary-component-service"

export async function createSalaryComponentAction(values: SalaryComponentInput) {
  try {
    const validatedFields = salaryComponentSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data input tidak valid." }
    }

    const result = await SalaryComponentService.create(validatedFields.data)
    revalidatePath("/admin/payroll/components")
    return { success: true, data: result }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat menyimpan komponen gaji." }
  }
}

export async function updateSalaryComponentAction(values: UpdateSalaryComponentInput) {
  try {
    const validatedFields = updateSalaryComponentSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data input tidak valid." }
    }

    const result = await SalaryComponentService.update(validatedFields.data)
    revalidatePath("/admin/payroll/components")
    return { success: true, data: result }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat menyimpan komponen gaji." }
  }
}

export async function deleteSalaryComponentAction(id: string) {
  try {
    await SalaryComponentService.delete(id)
    revalidatePath("/admin/payroll/components")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat menghapus komponen gaji." }
  }
}
