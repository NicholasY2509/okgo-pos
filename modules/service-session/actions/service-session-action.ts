"use server"

import { revalidatePath } from "next/cache"
import { ServiceSessionService } from "../services/service-session-service"
import { BranchService } from "@/modules/branch/services/branch-service"

export async function getStaffDailySessionsAction(staffId: string) {
  try {
    const sessions = await ServiceSessionService.getStaffDailySessions(staffId)
    return { success: true, data: sessions }
  } catch (error: any) {
    console.error("Failed to fetch daily sessions:", error)
    return { error: "Gagal mengambil riwayat sesi hari ini." }
  }
}

export async function startServiceSessionAction(sessionId: string, tenantSlug: string) {
  try {
    await ServiceSessionService.startSession(sessionId)
    revalidatePath(`/${tenantSlug}/kiosk/dashboard`)
    return { success: true }
  } catch (error: any) {
    console.error("Failed to start session:", error)
    return { error: "Gagal memulai sesi." }
  }
}

export async function endServiceSessionAction(sessionId: string, tenantSlug: string) {
  try {
    await ServiceSessionService.endSession(sessionId)
    revalidatePath(`/${tenantSlug}/kiosk/dashboard`)
    return { success: true }
  } catch (error: any) {
    console.error("Failed to end session:", error)
    return { error: "Gagal mengakhiri sesi."  }
  }
}

export async function getDailyReviewableSessionsAction(tenantSlug: string) {
  try {
    const branch = await BranchService.getBranchBySubdomain(tenantSlug)
    if (!branch) {
      return { error: "Cabang tidak ditemukan." }
    }
    const sessions = await ServiceSessionService.getDailyReviewableSessions(branch.id)
    return { success: true, data: sessions }
  } catch (error: any) {
    console.error("Failed to fetch reviewable sessions:", error)
    return { error: "Gagal mengambil sesi yang perlu diulas." }
  }
}

export async function submitReviewAction(sessionId: string, tenantSlug: string, rating: number, reviewComment?: string) {
  try {
    await ServiceSessionService.submitReview(sessionId, rating, reviewComment)
    revalidatePath(`/${tenantSlug}/reviews`)
    return { success: true }
  } catch (error: any) {
    console.error("Failed to submit review:", error)
    return { error: "Gagal mengirim ulasan." }
  }
}
