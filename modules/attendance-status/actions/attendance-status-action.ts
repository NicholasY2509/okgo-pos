"use server"

import { revalidatePath } from "next/cache"
import { attendanceStatusSchema, type AttendanceStatusInput } from "../schemas/attendance-status"
import { AttendanceStatusService } from "../services/attendance-status-service"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"

export async function createAttendanceStatusAction(values: AttendanceStatusInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const validatedFields = attendanceStatusSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." }
    }

    const result = await AttendanceStatusService.create(validatedFields.data)
    revalidatePath("/admin/attendance/statuses")
    return { success: true, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat membuat status."
    return { error: message }
  }
}

export async function updateAttendanceStatusAction(id: string, values: AttendanceStatusInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const validatedFields = attendanceStatusSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." }
    }

    const result = await AttendanceStatusService.update(id, validatedFields.data)
    revalidatePath("/admin/attendance/statuses")
    return { success: true, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui status."
    return { error: message }
  }
}

export async function deleteAttendanceStatusAction(id: string) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    await AttendanceStatusService.delete(id)
    revalidatePath("/admin/attendance/statuses")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus status."
    return { error: message }
  }
}

export async function getAttendanceStatusListAction() {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const data = await AttendanceStatusService.getAll()
    return { success: true, data }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengambil data status kehadiran."
    return { error: message }
  }
}
