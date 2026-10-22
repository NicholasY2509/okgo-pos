"use server"

import { AttendanceCalculationService } from "../services/attendance-calculation-service"
import { attendanceCalculationSchema, type AttendanceCalculationInput } from "../schemas/attendance-calculation"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"

export async function calculateAttendanceAction(values: AttendanceCalculationInput) {
  try {
    // const authCheck = await AuthGuardService.requireAuth(["ADMIN"])
    // if (!authCheck.success) {
    //   return { error: authCheck.error }
    // }

    const validatedFields = attendanceCalculationSchema.safeParse(values)

    if (!validatedFields.success) {
      return { error: "Data input tidak valid." }
    }

    const { startDate, endDate } = validatedFields.data

    const result = await AttendanceCalculationService.calculate(startDate, endDate)

    return { success: true, data: result }
  } catch (error: unknown) {
    console.error("Gagal melakukan kalkulasi kehadiran:", error)
    return { error: "Terjadi kesalahan saat mengkalkulasi kehadiran." }
  }
}
