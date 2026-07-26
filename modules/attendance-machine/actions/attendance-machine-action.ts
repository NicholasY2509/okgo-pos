"use server"

import { revalidatePath } from "next/cache"
import { attendanceMachineSchema, type AttendanceMachineInput } from "../schemas/attendance-machine"
import { AttendanceMachineService } from "../services/attendance-machine-service"

export async function createMachineAction(values: AttendanceMachineInput) {
  try {
    const validatedFields = attendanceMachineSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." }
    }

    const result = await AttendanceMachineService.create(validatedFields.data)
    revalidatePath("/admin/attendance/machines")
    return { success: true, data: result }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat menambahkan mesin." }
  }
}

export async function updateMachineAction(id: string, values: AttendanceMachineInput) {
  try {
    const validatedFields = attendanceMachineSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." }
    }

    const result = await AttendanceMachineService.update(id, validatedFields.data)
    revalidatePath("/admin/attendance/machines")
    return { success: true, data: result }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat memperbarui mesin." }
  }
}

export async function deleteMachineAction(id: string) {
  try {
    await AttendanceMachineService.delete(id)
    revalidatePath("/admin/attendance/machines")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat menghapus mesin." }
  }
}
