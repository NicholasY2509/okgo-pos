import { prisma } from "@/lib/prisma";

export const TransactionRepository = {
  async count(where: any) {
    return await prisma.transaction.count({ where });
  },

  async aggregateSums(where: any) {
    const activeWhere = {
      ...where,
      status: where.status ? where.status : { notIn: ["CANCELLED", "VOIDED"] }
    };
    return await prisma.transaction.aggregate({
      where: activeWhere,
      _sum: {
        totalAmount: true,
        discountTotal: true,
      }
    });
  },

  async findCashiersByIds(ids: string[]) {
    if (!ids || ids.length === 0) return [];
    return await prisma.staff.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      }
    });
  },

  async findUsersByIds(ids: string[]) {
    if (!ids || ids.length === 0) return [];
    return await prisma.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
      }
    });
  },

  async findGeneratedVouchers(transactionIds: string[]) {
    if (!transactionIds || transactionIds.length === 0) return [];
    return await prisma.customerVoucher.findMany({
      where: { sourceTransactionId: { in: transactionIds } },
      include: {
        redemptions: true
      }
    });
  },

  async findMany(where: any, skip: number, take: number) {
    return await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        customer: true,
        payments: {
          include: { paymentMethod: true }
        },
        items: {
          include: {
            serviceSessions: true
          }
        },
        voucherRedemptions: {
          include: {
            customerVoucher: {
              include: { voucherPacket: true }
            }
          }
        }
      }
    });
  }
};
