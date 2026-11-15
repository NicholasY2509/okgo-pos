import { prisma } from "@/lib/prisma";

const segmentsInclude = {
  orderBy: { sequenceOrder: "asc" as const },
  include: {
    staff: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    },
  },
};

async function enrichSessionsWithProducts<T extends { serviceId: string; segments?: any[] }>(
  sessions: T[]
) {
  const serviceIds = new Set<string>();
  for (const s of sessions) {
    if (s.serviceId) serviceIds.add(s.serviceId);
    for (const seg of s.segments || []) {
      if (seg.serviceId) serviceIds.add(seg.serviceId);
    }
  }

  const products =
    serviceIds.size > 0
      ? await prisma.product.findMany({
          where: { id: { in: Array.from(serviceIds) } },
          select: { id: true, name: true, duration: true },
        })
      : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  return sessions.map((s) => ({
    ...s,
    serviceProduct: productMap.get(s.serviceId) ?? null,
    segments: (s.segments || []).map((seg: any) => ({
      ...seg,
      serviceName: productMap.get(seg.serviceId)?.name ?? "Layanan",
    })),
  }));
}

export const TimetableRepository = {
  async getActiveSessions(branchId: string) {
    const sessions = await prisma.serviceSession.findMany({
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
                isVip: true,
                customer: {
                  select: { name: true, phone: true }
                }
              }
            }
          }
        },
        booking: {
          include: {
            items: true,
            customer: { select: { name: true, phone: true } }
          }
        },
        staff: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        segments: segmentsInclude,
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    return await enrichSessionsWithProducts(sessions);
  },

  async getRoomSessions(branchId: string, roomId: string, date?: string) {
    const whereClause: any = {
      branchId,
      roomId,
    };

    if (date) {
      // User specified a date string YYYY-MM-DD
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      whereClause.OR = [
        // Scheduled or In-progress sessions
        { status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
        // Completed sessions strictly within the target date
        {
          status: "COMPLETED",
          OR: [
            { actualEndTime: { gte: startOfDay, lte: endOfDay } },
            { actualStartTime: { gte: startOfDay, lte: endOfDay } },
            { startTime: { gte: startOfDay, lte: endOfDay } },
          ],
        },
      ];
    } else {
      // Default: only fetch completed sessions for today (using server local time or UTC bounds)
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      whereClause.OR = [
        { status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
        {
          status: "COMPLETED",
          OR: [
            { actualEndTime: { gte: startOfToday, lte: endOfToday } },
            { actualStartTime: { gte: startOfToday, lte: endOfToday } },
            { startTime: { gte: startOfToday, lte: endOfToday } },
          ],
        },
      ];
    }

    const sessions = await prisma.serviceSession.findMany({
      where: whereClause,
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
                isVip: true,
                customer: {
                  select: { name: true, phone: true }
                }
              }
            }
          }
        },
        booking: {
          include: {
            items: true,
            customer: { select: { name: true, phone: true } }
          }
        },
        staff: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        segments: segmentsInclude,
      },
      orderBy: [
        { startTime: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return await enrichSessionsWithProducts(sessions);
  },

  async getSessionsByDateRange(branchId: string, startOfDay: Date, endOfDay: Date) {
    const sessions = await prisma.serviceSession.findMany({
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
                isVip: true,
                customer: {
                  select: { name: true, phone: true }
                },
                items: true
              }
            }
          }
        },
        booking: {
          include: {
            items: true,
            customer: { select: { name: true, phone: true } }
          }
        },
        staff: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        segments: segmentsInclude,
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    return await enrichSessionsWithProducts(sessions);
  },

  async getSessionByIdWithIncludes(sessionId: string) {
    return await prisma.serviceSession.findUnique({
      where: { id: sessionId },
      include: {
        transactionItem: {
          include: { transaction: true }
        },
        booking: true,
        segments: {
          orderBy: { sequenceOrder: "asc" }
        }
      }
    });
  },

  async startSessionWithSegments(sessionId: string, now: Date) {
    return await prisma.$transaction(async (tx) => {
      const firstScheduled = await tx.serviceSessionSegment.findFirst({
        where: { serviceSessionId: sessionId, status: "SCHEDULED" },
        orderBy: { sequenceOrder: "asc" },
      });

      if (firstScheduled) {
        await tx.serviceSessionSegment.update({
          where: { id: firstScheduled.id },
          data: { status: "IN_PROGRESS", actualStartTime: now },
        });
      }

      return await tx.serviceSession.update({
        where: { id: sessionId },
        data: { status: "IN_PROGRESS", actualStartTime: now },
      });
    });
  },

  async completeSessionWithSegments(sessionId: string, now: Date) {
    return await prisma.$transaction(async (tx) => {
      await tx.serviceSessionSegment.updateMany({
        where: {
          serviceSessionId: sessionId,
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        },
        data: { status: "COMPLETED", actualEndTime: now },
      });

      return await tx.serviceSession.update({
        where: { id: sessionId },
        data: { status: "COMPLETED", actualEndTime: now },
      });
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
        items: {
          include: {
            requestedStaff: true
          }
        },
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
  },

  async getLoadableBookings(branchId: string) {
    return await prisma.booking.findMany({
      where: {
        branchId,
        status: { in: ['PENDING', 'PROCESSED'] }
      },
      include: {
        customer: true,
        items: true,
        appliedVoucher: {
          include: {
            voucherPacket: {
              include: {
                product: true
              }
            }
          }
        },
        serviceSessions: {
          include: {
            staff: true
          }
        }
      },
      orderBy: {
        scheduledStartTime: 'asc'
      }
    });
  },
};
