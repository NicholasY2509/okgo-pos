"use server"

import { revalidatePath } from "next/cache"
import {
  salaryComponentSchema,
  updateSalaryComponentSchema,
  type SalaryComponentInput,
  type UpdateSalaryComponentInput
} from "../schemas/salary-component"
import { SalaryComponentService } from "../services/salary-component-service"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"

export async function createSalaryComponentAction(values: SalaryComponentInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const validatedFields = salaryComponentSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data input tidak valid." }
    }

    const result = await SalaryComponentService.create(validatedFields.data)
    revalidatePath("/admin/salaries/components")
    return { success: true, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan komponen gaji."
    return { error: message }
  }
}

export async function updateSalaryComponentAction(values: UpdateSalaryComponentInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const validatedFields = updateSalaryComponentSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data input tidak valid." }
    }

    const result = await SalaryComponentService.update(validatedFields.data)
    revalidatePath("/admin/salaries/components")
    return { success: true, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan komponen gaji."
    return { error: message }
  }
}

export async function deleteSalaryComponentAction(id: string) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    await SalaryComponentService.delete(id)
    revalidatePath("/admin/salaries/components")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus komponen gaji."
    return { error: message }
  }
}
