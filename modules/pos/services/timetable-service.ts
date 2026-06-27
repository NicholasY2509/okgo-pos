import { prisma } from "@/lib/prisma";

export class TimetableService {
  static async getActiveSessions(branchId: string) {
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
                customer: {
                  select: { name: true }
                }
              }
            }
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

    return sessions.map(session => ({
      ...session,
      transactionItem: session.transactionItem ? {
        ...session.transactionItem,
        unitPrice: session.transactionItem.unitPrice ? Number(session.transactionItem.unitPrice) : 0,
        discountAmount: session.transactionItem.discountAmount ? Number(session.transactionItem.discountAmount) : 0,
        subtotal: session.transactionItem.subtotal ? Number(session.transactionItem.subtotal) : 0,
        transaction: session.transactionItem.transaction ? {
          ...session.transactionItem.transaction,
          totalAmount: session.transactionItem.transaction.totalAmount ? Number(session.transactionItem.transaction.totalAmount) : 0,
          paidAmount: session.transactionItem.transaction.paidAmount ? Number(session.transactionItem.transaction.paidAmount) : 0,
          subtotal: session.transactionItem.transaction.subtotal ? Number(session.transactionItem.transaction.subtotal) : 0,
          discountTotal: session.transactionItem.transaction.discountTotal ? Number(session.transactionItem.transaction.discountTotal) : 0,
        } : null,
      } : (null as any),
      customer: session.transactionItem?.transaction?.customer || null
    }));
  }

  static async getSessionsByDate(branchId: string, dateStr: string) {
    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) throw new Error("Invalid date format");

    // Set to start and end of the specified date (in local time ideally, but let's assume UTC/server time for now or we can just use simple string prefix if it was string, but dates in DB are Date objects. We'll use startOfDay and endOfDay)
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

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
                customer: {
                  select: { name: true }
                }
              }
            }
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

    return sessions.map(session => ({
      ...session,
      transactionItem: session.transactionItem ? {
        ...session.transactionItem,
        unitPrice: session.transactionItem.unitPrice ? Number(session.transactionItem.unitPrice) : 0,
        discountAmount: session.transactionItem.discountAmount ? Number(session.transactionItem.discountAmount) : 0,
        subtotal: session.transactionItem.subtotal ? Number(session.transactionItem.subtotal) : 0,
        transaction: session.transactionItem.transaction ? {
          ...session.transactionItem.transaction,
          totalAmount: session.transactionItem.transaction.totalAmount ? Number(session.transactionItem.transaction.totalAmount) : 0,
          paidAmount: session.transactionItem.transaction.paidAmount ? Number(session.transactionItem.transaction.paidAmount) : 0,
          subtotal: session.transactionItem.transaction.subtotal ? Number(session.transactionItem.transaction.subtotal) : 0,
          discountTotal: session.transactionItem.transaction.discountTotal ? Number(session.transactionItem.transaction.discountTotal) : 0,
        } : null,
      } : (null as any),
      customer: session.transactionItem?.transaction?.customer || null
    }));
  }

  static async completeSession(sessionId: string) {
    const session = await prisma.serviceSession.findUnique({
      where: { id: sessionId },
      include: {
        transactionItem: {
          include: { transaction: true }
        }
      }
    });

    if (!session) throw new Error("Session not found");
    if (session.status !== "IN_PROGRESS") throw new Error("Session is not in progress");

    if (session.transactionItem?.transaction?.status === "PENDING") {
      throw new Error("Sesi tidak dapat diselesaikan karena pembayaran belum lunas.");
    }

    return await prisma.serviceSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED", endTime: new Date() }
    });
  }

  static async startSession(sessionId: string) {
    const session = await prisma.serviceSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) throw new Error("Session not found");
    if (session.status !== "SCHEDULED") throw new Error("Sesi tidak dalam status terjadwal");

    const now = new Date();
    const durationMs = session.endTime && session.startTime 
      ? session.endTime.getTime() - session.startTime.getTime()
      : 60 * 60 * 1000; // Default 1 hour if not set

    return await prisma.serviceSession.update({
      where: { id: sessionId },
      data: { 
        status: "IN_PROGRESS",
        startTime: now,
        endTime: new Date(now.getTime() + durationMs)
      }
    });
  }

  static async updateSessionTime(sessionId: string, startTime: Date, endTime: Date) {
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error("Waktu tidak valid");
    }

    if (endTime <= startTime) {
      throw new Error("Waktu selesai harus setelah waktu mulai");
    }

    return await prisma.serviceSession.update({
      where: { id: sessionId },
      data: {
        startTime,
        endTime
      }
    });
  }
}
