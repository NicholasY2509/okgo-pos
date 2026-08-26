"use server"

import { revalidatePath } from "next/cache"
import { attendanceStatusSchema, type AttendanceStatusInput } from "../schemas/attendance-status"
import { AttendanceStatusService } from "../services/attendance-status-service"

export async function createAttendanceStatusAction(values: AttendanceStatusInput) {
  try {
    const validatedFields = attendanceStatusSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." }
    }

    const result = await AttendanceStatusService.create(validatedFields.data)
    revalidatePath("/admin/attendance/statuses")
    return { success: true, data: result }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat membuat status." }
  }
}

export async function updateAttendanceStatusAction(id: string, values: AttendanceStatusInput) {
  try {
    const validatedFields = attendanceStatusSchema.safeParse(values)
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." }
    }

    const result = await AttendanceStatusService.update(id, validatedFields.data)
    revalidatePath("/admin/attendance/statuses")
    return { success: true, data: result }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat memperbarui status." }
  }
}

export async function deleteAttendanceStatusAction(id: string) {
  try {
    await AttendanceStatusService.delete(id)
    revalidatePath("/admin/attendance/statuses")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat menghapus status." }
  }
}

export async function getAttendanceStatusListAction() {
  try {
    const data = await AttendanceStatusService.getAll()
    return { success: true, data }
  } catch (error: any) {
    return { error: error.message || "Gagal mengambil data status kehadiran." }
  }
}
