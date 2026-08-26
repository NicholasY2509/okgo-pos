"use server"

import { staffSalarySchema, StaffSalaryInput } from "../schemas/staff-salary-schema"
import { StaffSalaryService } from "../services/staff-salary-service"

export async function createStaffSalaryAction(values: StaffSalaryInput) {
  try {
    const validatedFields = staffSalarySchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data gaji tidak valid." }
    }

    const result = await StaffSalaryService.create(validatedFields.data)
    return { success: true, data: result }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat menyimpan data gaji." }
  }
}

export async function updateStaffSalaryAction(id: string, values: StaffSalaryInput) {
  try {
    const validatedFields = staffSalarySchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data gaji tidak valid." }
    }

    const result = await StaffSalaryService.update(id, validatedFields.data)
    return { success: true, data: result }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat memperbarui data gaji." }
  }
}

export async function deleteStaffSalaryAction(id: string) {
  try {
    await StaffSalaryService.delete(id)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat menghapus data gaji." }
  }
}
