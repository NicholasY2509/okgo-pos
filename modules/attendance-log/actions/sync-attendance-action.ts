"use server"

import { revalidatePath } from "next/cache"
import { syncAttendanceSchema, type SyncAttendanceInput } from "../schemas/sync-attendance-schema"
import { AttendanceSyncService } from "../services/attendance-sync-service"

export async function syncAttendanceFromMachineAction(values?: Partial<SyncAttendanceInput>) {
  try {
    const payload = {
      ipAddress: values?.ipAddress || "192.168.1.231",
      username: values?.username || "admin",
      password: values?.password || "Fingerspot",
      count: values?.count ?? 1000,
      ignoreUnrecognized: values?.ignoreUnrecognized ?? true
    }
    const validatedFields = syncAttendanceSchema.safeParse(payload)
    if (!validatedFields.success) {
      return { error: "Konfigurasi penarikan log tidak valid." }
    }

    const result = await AttendanceSyncService.syncAttendanceLogs(validatedFields.data)

    revalidatePath("/admin/attendance-log")
    revalidatePath("/admin/attendance")

    return {
      success: true,
      data: result
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan saat menarik data log dari mesin."
    return { error: message }
  }
}

export async function purgeUnrecognizedLogsAction(branchId?: string) {
  try {
    const result = await AttendanceSyncService.purgeUnrecognizedLogs(branchId)

    revalidatePath("/admin/attendance-log")
    revalidatePath("/admin/attendance")

    return {
      success: true,
      data: result
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal membersihkan data log tidak dikenal."
    return { error: message }
  }
}
