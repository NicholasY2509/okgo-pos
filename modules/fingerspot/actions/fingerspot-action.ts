"use server"

import { revalidatePath } from "next/cache"
import {
  fingerspotAttlogSchema,
  fingerspotDeviceSchema,
  fingerspotUserIdListSchema,
  fingerspotUserInfoSchema,
  fingerspotSetUserInfoSchema,
  type FingerspotAttlogInput,
  type FingerspotDeviceInput,
  type FingerspotUserIdListInput,
  type FingerspotUserInfoInput,
  type FingerspotSetUserInfoInput,
} from "../schemas/fingerspot-schema"
import { FingerspotService } from "../services/fingerspot-service"

export async function getDeviceAction(values: FingerspotDeviceInput) {
  try {
    const validated = fingerspotDeviceSchema.safeParse(values)
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || "Input tidak valid" }
    }

    const result = await FingerspotService.getDevice(validated.data)
    return { success: true, data: result }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Terjadi kesalahan saat memeriksa perangkat"
    return { error: msg }
  }
}

export async function getAttlogAction(values: FingerspotAttlogInput) {
  try {
    const validated = fingerspotAttlogSchema.safeParse(values)
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || "Input tidak valid" }
    }

    const result = await FingerspotService.getAttlog(validated.data)
    revalidatePath("/admin/attendance/fingerspot")
    revalidatePath("/admin/attendance-log")
    return { success: true, data: result }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Terjadi kesalahan saat menarik data absensi"
    return { error: msg }
  }
}

export async function requestUserIdListAction(values: FingerspotUserIdListInput) {
  try {
    const validated = fingerspotUserIdListSchema.safeParse(values)
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || "Input tidak valid" }
    }

    const result = await FingerspotService.requestUserIdList(validated.data)
    return { success: true, data: result }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Terjadi kesalahan saat meminta daftar user"
    return { error: msg }
  }
}

export async function requestUserInfoAction(values: FingerspotUserInfoInput) {
  try {
    const validated = fingerspotUserInfoSchema.safeParse(values)
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || "Input tidak valid" }
    }

    const result = await FingerspotService.requestUserInfo(validated.data)
    return { success: true, data: result }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Terjadi kesalahan saat meminta info user"
    return { error: msg }
  }
}

export async function setUserInfoAction(values: FingerspotSetUserInfoInput) {
  try {
    const validated = fingerspotSetUserInfoSchema.safeParse(values)
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || "Input tidak valid" }
    }

    const result = await FingerspotService.setUserInfo(validated.data)
    return { success: true, data: result }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Terjadi kesalahan saat mengatur user di mesin"
    return { error: msg }
  }
}

export async function getRecentPunchLogsAction(deviceSn?: string) {
  try {
    const logs = await FingerspotService.getRecentLogs(20, deviceSn)
    return { success: true, data: logs }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Gagal memuat log absensi terbaru"
    return { error: msg }
  }
}
