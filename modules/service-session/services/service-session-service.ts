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
    const brandSetting = await prisma.brandSetting.findFirst();

    if (brandSetting) {
      if (brandSetting.therapistIncentiveType === "FIXED") {
        commissionAmount = Number(brandSetting.therapistIncentiveAmount);
      } else if (brandSetting.therapistIncentiveType === "DURATION_BASED") {
        // Fetch service duration
        const product = await prisma.product.findUnique({ where: { id: session.serviceId } });
        const duration = product?.duration || 60; // default to 60 if not set
        const baseDuration = brandSetting.therapistIncentiveDuration || 60;
        
        commissionAmount = (duration / baseDuration) * Number(brandSetting.therapistIncentiveAmount);
      }
    }

    return await ServiceSessionRepository.endSession(sessionId, commissionAmount)
  }

  static async getDailyReviewableSessions(tenantId: string) {
    return await ServiceSessionRepository.getDailyReviewableSessions(tenantId)
  }

  static async submitReview(sessionId: string, rating: number, reviewComment?: string) {
    return await ServiceSessionRepository.submitReview(sessionId, rating, reviewComment)
  }
}
