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
    const targetIp = values?.ipAddress || "192.168.1.231"
    const isLocalPrivateIp = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|127\.)/.test(targetIp)

    let message =
      error instanceof Error ? error.message : "Terjadi kesalahan saat menarik data log dari mesin."

    if (
      isLocalPrivateIp &&
      (message.toLowerCase().includes("fetch failed") ||
        message.toLowerCase().includes("timeout") ||
        message.toLowerCase().includes("abort"))
    ) {
      message = `Gagal terhubung ke IP lokal (${targetIp}). Server production di cloud tidak dapat mengakses IP privat di jaringan LAN/Wi-Fi cabang secara langsung. Gunakan IP Publik/DDNS, VPN (Tailscale), atau relay agent.`
    }

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
