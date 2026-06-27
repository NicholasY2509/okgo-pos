import { prisma } from "@/lib/prisma";

export interface TransactionFilterInput {
  branchId: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class TransactionService {
  static async getBranchTransactions(filters: TransactionFilterInput) {
    const { branchId, startDate, endDate, status, search, page = 1, limit = 10 } = filters;

    const where: any = {
      branchId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { transactionNumber: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
    }

    const total = await prisma.transaction.count({ where });

    const aggregate = await prisma.transaction.aggregate({
      where,
      _sum: {
        totalAmount: true,
        discountTotal: true,
      }
    });

    const summary = {
      totalTransactions: total,
      totalSales: Number(aggregate._sum.totalAmount || 0),
      totalDiscounts: Number(aggregate._sum.discountTotal || 0),
    };

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
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

    // Serialize Decimal values for Client Components
    const serializedData = transactions.map(t => ({
      ...t,
      subtotal: Number(t.subtotal),
      discountTotal: Number(t.discountTotal),
      taxTotal: Number(t.taxTotal),
      totalAmount: Number(t.totalAmount),
      paidAmount: Number(t.paidAmount),
      changeAmount: Number(t.changeAmount),
      items: t.items.map(i => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        discountAmount: Number(i.discountAmount),
        subtotal: Number(i.subtotal),
      })),
      payments: t.payments.map(p => ({
        ...p,
        amount: Number(p.amount),
      })),
      voucherRedemptions: t.voucherRedemptions.map(vr => ({
        ...vr,
        redeemedAmount: vr.redeemedAmount ? Number(vr.redeemedAmount) : null,
      }))
    }));

    return {
      data: serializedData,
      summary,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}
