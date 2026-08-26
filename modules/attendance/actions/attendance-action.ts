"use server"

import { revalidatePath } from "next/cache"
import { AttendanceService } from "../services/attendance-service"

export async function updateAttendanceStatusAction(attendanceId: string, statusId: string) {
  try {
    const result = await AttendanceService.updateStatus(attendanceId, statusId)
    revalidatePath("/admin/attendance/data")
    return { success: true, data: result }
  } catch (error: any) {
    return { error: error.message || "Terjadi kesalahan saat memperbarui status kehadiran." }
  }
}
