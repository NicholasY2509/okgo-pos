import { TransactionRepository } from "../repositories/transaction-repository";

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

    const total = await TransactionRepository.count(where);
    const aggregate = await TransactionRepository.aggregateSums(where);

    const summary = {
      totalTransactions: total,
      totalSales: Number(aggregate._sum.totalAmount || 0),
      totalDiscounts: Number(aggregate._sum.discountTotal || 0),
    };

    const skip = (page - 1) * limit;
    const transactions = await TransactionRepository.findMany(where, skip, limit);

    // Serialize Decimal values for Client Components
    const serializedData = transactions.map(t => ({
      ...t,
      subtotal: Number(t.subtotal),
      discountTotal: Number(t.discountTotal),
      taxTotal: Number(t.taxTotal),
      totalAmount: Number(t.totalAmount),
      paidAmount: Number(t.paidAmount),
      changeAmount: Number(t.changeAmount),
      items: t.items.map((i: any) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        discountAmount: Number(i.discountAmount),
        subtotal: Number(i.subtotal),
      })),
      payments: t.payments.map((p: any) => ({
        ...p,
        amount: Number(p.amount),
      })),
      voucherRedemptions: t.voucherRedemptions.map((vr: any) => ({
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
