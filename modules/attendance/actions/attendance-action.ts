"use server"

import { revalidatePath } from "next/cache"
import { AttendanceService } from "../services/attendance-service"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"

export async function updateAttendanceStatusAction(attendanceId: string, statusId: string, attachmentUrl?: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const result = await AttendanceService.updateStatus(attendanceId, statusId, attachmentUrl)
    revalidatePath("/admin/attendance/data")
    return { success: true, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui status kehadiran."
    return { error: message }
  }
}
