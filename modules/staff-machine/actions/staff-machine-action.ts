"use server"

import { revalidatePath } from "next/cache"
import { staffMachineSchema, type StaffMachineInput } from "../schemas/staff-machine"
import { StaffMachineService } from "../services/staff-machine-service"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"

export async function createStaffMachineAction(values: StaffMachineInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const validatedFields = staffMachineSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." }
    }

    const result = await StaffMachineService.create(validatedFields.data)
    revalidatePath(`/admin/staff/${values.staffId}`)
    return { success: true, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat menautkan ID ke mesin."
    return { error: message }
  }
}

export async function updateStaffMachineAction(id: string, values: StaffMachineInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const validatedFields = staffMachineSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." }
    }

    const result = await StaffMachineService.update(id, validatedFields.data)
    revalidatePath(`/admin/staff/${values.staffId}`)
    return { success: true, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui ID mesin."
    return { error: message }
  }
}

export async function deleteStaffMachineAction(id: string, staffId: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    await StaffMachineService.delete(id)
    revalidatePath(`/admin/staff/${staffId}`)
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus data ID mesin."
    return { error: message }
  }
}
