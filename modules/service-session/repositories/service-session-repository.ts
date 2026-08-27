import { prisma } from "@/lib/prisma"

export const ServiceSessionRepository = {
  async getStaffDailySessions(staffId: string) {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    return await prisma.serviceSession.findMany({
      where: {
        staffId,
        status: { in: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] },
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      orderBy: { createdAt: "asc" },
      include: {
        transactionItem: {
          include: {
            transaction: {
              include: {
                customer: true
              }
            }
          }
        },
        booking: {
          include: {
            customer: true
          }
        },
      }
    })
  },

  async startSession(sessionId: string) {
    return await prisma.serviceSession.update({
      where: { id: sessionId },
      data: {
        status: "IN_PROGRESS",
        actualStartTime: new Date(),
      }
    })
  },

  async getById(sessionId: string) {
    return await prisma.serviceSession.findUnique({
      where: { id: sessionId },
    })
  },

  async endSession(sessionId: string, commissionAmount: number = 0) {
    return await prisma.serviceSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        actualEndTime: new Date(),
        therapistCommissionAmount: commissionAmount,
      }
    })
  },

  async getDailyReviewableSessions(tenantId: string) {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    return await prisma.serviceSession.findMany({
      where: {
        branchId: tenantId, // Assuming tenantId maps to branchId in this context
        status: "COMPLETED",
        rating: null,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      orderBy: { actualEndTime: "desc" },
      include: {
        staff: true,
        transactionItem: {
          include: {
            transaction: {
              include: { customer: true }
            }
          }
        }
      }
    })
  },

  async submitReview(sessionId: string, rating: number, reviewComment?: string) {
    return await prisma.serviceSession.update({
      where: { id: sessionId },
      data: {
        rating,
        reviewComment,
      }
    })
  }
}
