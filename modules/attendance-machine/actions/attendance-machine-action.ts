"use server"

import { revalidatePath } from "next/cache"
import { attendanceMachineSchema, type AttendanceMachineInput } from "../schemas/attendance-machine"
import { AttendanceMachineService } from "../services/attendance-machine-service"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"

export async function createMachineAction(values: AttendanceMachineInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const validatedFields = attendanceMachineSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." }
    }

    const result = await AttendanceMachineService.create(validatedFields.data)
    revalidatePath("/admin/attendance/machines")
    return { success: true, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat menambahkan mesin."
    return { error: message }
  }
}

export async function updateMachineAction(id: string, values: AttendanceMachineInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const validatedFields = attendanceMachineSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." }
    }

    const result = await AttendanceMachineService.update(id, validatedFields.data)
    revalidatePath("/admin/attendance/machines")
    return { success: true, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui mesin."
    return { error: message }
  }
}

export async function deleteMachineAction(id: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    await AttendanceMachineService.delete(id)
    revalidatePath("/admin/attendance/machines")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus mesin."
    return { error: message }
  }
}
