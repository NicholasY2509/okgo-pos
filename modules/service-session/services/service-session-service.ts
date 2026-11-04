import {
  ServiceSessionRepository,
  type GetServiceSessionsParams,
} from "../repositories/service-session-repository"

export class ServiceSessionService {
  static async getServiceSessions(params: GetServiceSessionsParams) {
    return await ServiceSessionRepository.getServiceSessions(params)
  }

  static async getServiceSessionFilterOptions(branchId: string) {
    return await ServiceSessionRepository.getServiceSessionFilterOptions(branchId)
  }

  static async getStaffDailySessions(staffId: string) {
    return await ServiceSessionRepository.getStaffDailySessions(staffId)
  }

  static async startSession(sessionId: string) {
    return await ServiceSessionRepository.startSession(sessionId)
  }

  static async endSession(sessionId: string) {
    const session = await ServiceSessionRepository.getById(sessionId)
    if (!session) throw new Error("Session not found")

    const commissionAmount = 0;
    // FIXME: Commission calculation needs to be updated to use IncentiveRule
    // The previous BrandSetting properties (therapistIncentiveType, etc.) have been removed.

    const gross = session.transactionItem?.unitPrice ? Number(session.transactionItem.unitPrice) : 0;

    return await ServiceSessionRepository.endSession(sessionId, commissionAmount, session.staffId, gross)
  }

  static async getDailyReviewableSessions(tenantId: string) {
    return await ServiceSessionRepository.getDailyReviewableSessions(tenantId)
  }

  static async submitReview(sessionId: string, rating: number, reviewComment?: string) {
    return await ServiceSessionRepository.submitReview(sessionId, rating, reviewComment)
  }
}
