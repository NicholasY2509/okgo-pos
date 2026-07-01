import { prisma } from "@/lib/prisma";

export const TimetableRepository = {
  async getActiveSessions(branchId: string) {
    return await prisma.serviceSession.findMany({
      where: {
        branchId,
        status: {
          in: ["SCHEDULED", "IN_PROGRESS"]
        }
      },
      include: {
        transactionItem: {
          include: {
            transaction: {
              select: {
                id: true,
                status: true,
                totalAmount: true,
                paidAmount: true,
                subtotal: true,
                discountTotal: true,
                customer: {
                  select: { name: true }
                }
              }
            }
          }
        },
        booking: {
          include: {
            items: true,
            customer: { select: { name: true } }
          }
        },
        staff: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });
  },

  async getSessionsByDateRange(branchId: string, startOfDay: Date, endOfDay: Date) {
    return await prisma.serviceSession.findMany({
      where: {
        branchId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        transactionItem: {
          include: {
            transaction: {
              select: {
                id: true,
                status: true,
                totalAmount: true,
                paidAmount: true,
                subtotal: true,
                discountTotal: true,
                customer: {
                  select: { name: true }
                },
                items: true
              }
            }
          }
        },
        booking: {
          include: {
            items: true,
            customer: { select: { name: true } }
          }
        },
        staff: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });
  },

  async getSessionByIdWithIncludes(sessionId: string) {
    return await prisma.serviceSession.findUnique({
      where: { id: sessionId },
      include: {
        transactionItem: {
          include: { transaction: true }
        },
        booking: true
      }
    });
  },

  async getSessionById(sessionId: string) {
    return await prisma.serviceSession.findUnique({
      where: { id: sessionId }
    });
  },

  async updateSession(sessionId: string, data: any) {
    return await prisma.serviceSession.update({
      where: { id: sessionId },
      data
    });
  },

  async getStaffById(staffId: string) {
    return await prisma.staff.findUnique({
      where: { id: staffId }
    });
  },

  async getPendingBookings(branchId: string) {
    return await prisma.booking.findMany({
      where: {
        branchId,
        status: 'PENDING'
      },
      include: {
        customer: true,
        items: true,
        serviceSessions: {
          include: {
            staff: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }
};
