import { ServiceSessionRepository } from "../repositories/service-session-repository"

export class ServiceSessionService {
  static async getStaffDailySessions(staffId: string) {
    return await ServiceSessionRepository.getStaffDailySessions(staffId)
  }

  static async startSession(sessionId: string) {
    return await ServiceSessionRepository.startSession(sessionId)
  }

  static async endSession(sessionId: string) {
    return await ServiceSessionRepository.endSession(sessionId)
  }

  static async getDailyReviewableSessions(tenantId: string) {
    return await ServiceSessionRepository.getDailyReviewableSessions(tenantId)
  }

  static async submitReview(sessionId: string, rating: number, reviewComment?: string) {
    return await ServiceSessionRepository.submitReview(sessionId, rating, reviewComment)
  }
}
