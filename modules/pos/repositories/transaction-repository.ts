import { prisma } from "@/lib/prisma";

export const TransactionRepository = {
  async count(where: any) {
    return await prisma.transaction.count({ where });
  },

  async aggregateSums(where: any) {
    return await prisma.transaction.aggregate({
      where,
      _sum: {
        totalAmount: true,
        discountTotal: true,
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
