"use server"

import { staffSalarySchema, StaffSalaryInput } from "../schemas/staff-salary-schema"
import { StaffSalaryService } from "../services/staff-salary-service"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"

export async function createStaffSalaryAction(values: StaffSalaryInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const validatedFields = staffSalarySchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data gaji tidak valid." }
    }

    const result = await StaffSalaryService.create(validatedFields.data)
    return { success: true, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan data gaji."
    return { error: message }
  }
}

export async function updateStaffSalaryAction(id: string, values: StaffSalaryInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const validatedFields = staffSalarySchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data gaji tidak valid." }
    }

    const result = await StaffSalaryService.update(id, validatedFields.data)
    return { success: true, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui data gaji."
    return { error: message }
  }
}

export async function deleteStaffSalaryAction(id: string) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    await StaffSalaryService.delete(id)
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus data gaji."
    return { error: message }
  }
}
