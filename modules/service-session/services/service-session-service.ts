import { ServiceSessionRepository } from "../repositories/service-session-repository"
import { prisma } from "@/lib/prisma"

export class ServiceSessionService {
  static async getStaffDailySessions(staffId: string) {
    return await ServiceSessionRepository.getStaffDailySessions(staffId)
  }

  static async startSession(sessionId: string) {
    return await ServiceSessionRepository.startSession(sessionId)
  }

  static async endSession(sessionId: string) {
    const session = await ServiceSessionRepository.getById(sessionId)
    if (!session) throw new Error("Session not found")

    let commissionAmount = 0;
    // FIXME: Commission calculation needs to be updated to use IncentiveRule
    // The previous BrandSetting properties (therapistIncentiveType, etc.) have been removed.

    return await ServiceSessionRepository.endSession(sessionId, commissionAmount, session.staffId)
  }

  static async getDailyReviewableSessions(tenantId: string) {
    return await ServiceSessionRepository.getDailyReviewableSessions(tenantId)
  }

  static async submitReview(sessionId: string, rating: number, reviewComment?: string) {
    return await ServiceSessionRepository.submitReview(sessionId, rating, reviewComment)
  }
}
