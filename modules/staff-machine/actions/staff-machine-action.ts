"use server"

import { revalidatePath } from "next/cache"
import { staffMachineSchema, type StaffMachineInput } from "../schemas/staff-machine"
import { StaffMachineService } from "../services/staff-machine-service"

export async function createStaffMachineAction(values: StaffMachineInput) {
  try {
    const validatedFields = staffMachineSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." }
    }

    const result = await StaffMachineService.create(validatedFields.data)
    revalidatePath(`/admin/staff/${values.staffId}`)
    return { success: true, data: result }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat menautkan ID ke mesin." }
  }
}

export async function updateStaffMachineAction(id: string, values: StaffMachineInput) {
  try {
    const validatedFields = staffMachineSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." }
    }

    const result = await StaffMachineService.update(id, validatedFields.data)
    revalidatePath(`/admin/staff/${values.staffId}`)
    return { success: true, data: result }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat memperbarui ID mesin." }
  }
}

export async function deleteStaffMachineAction(id: string, staffId: string) {
  try {
    await StaffMachineService.delete(id)
    revalidatePath(`/admin/staff/${staffId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat menghapus data ID mesin." }
  }
}
