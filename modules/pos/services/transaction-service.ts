import { TransactionRepository } from "../repositories/transaction-repository";
import { BranchRepository } from "@/modules/branch/repositories/branch-repository";

export interface TransactionFilterInput {
  branchId?: string;
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

    const where: any = {};
    if (branchId && branchId !== "all") {
      where.branchId = branchId;
    }

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
    const activeWhere = {
      ...where,
      status: where.status ? where.status : { notIn: ["CANCELLED", "VOIDED"] }
    };
    const activeCount = await TransactionRepository.count(activeWhere);
    const aggregate = await TransactionRepository.aggregateSums(where);

    const summary = {
      totalTransactions: activeCount,
      totalSales: Number(aggregate._sum.totalAmount || 0),
      totalDiscounts: Number(aggregate._sum.discountTotal || 0),
    };

    const skip = (page - 1) * limit;
    const transactions = await TransactionRepository.findMany(where, skip, limit);

    const cashierIds = Array.from(
      new Set(transactions.map((t) => t.cashierId).filter((id): id is string => Boolean(id)))
    );

    const cashierMap: Record<string, { id: string; name: string }> = {};

    if (cashierIds.length > 0) {
      const staffList = await TransactionRepository.findCashiersByIds(cashierIds);
      const foundStaffIds = new Set<string>();

      for (const staff of staffList) {
        foundStaffIds.add(staff.id);
        const fullName = [staff.firstName, staff.lastName].filter(Boolean).join(" ").trim();
        cashierMap[staff.id] = {
          id: staff.id,
          name: fullName || "Staff",
        };
      }

      const remainingIds = cashierIds.filter((id) => !foundStaffIds.has(id));
      if (remainingIds.length > 0) {
        const userList = await TransactionRepository.findUsersByIds(remainingIds);
        for (const user of userList) {
          cashierMap[user.id] = {
            id: user.id,
            name: user.name || "User",
          };
        }
      }
    }

    const transactionIds = transactions.map((t) => t.id);
    const generatedVouchers = await TransactionRepository.findGeneratedVouchers(transactionIds);
    const voucherMap: Record<string, any[]> = {};
    for (const v of generatedVouchers) {
      if (v.sourceTransactionId) {
        if (!voucherMap[v.sourceTransactionId]) {
          voucherMap[v.sourceTransactionId] = [];
        }
        voucherMap[v.sourceTransactionId].push(v);
      }
    }

    const branchIds = Array.from(
      new Set(transactions.map((t) => t.branchId).filter((id): id is string => Boolean(id)))
    );
    const branchList = await BranchRepository.getBranchesByIds(branchIds);
    const branchMap = new Map(branchList.map((b) => [b.id, b]));

    // Serialize Decimal values for Client Components
    const serializedData = transactions.map(t => {
      const branch = t.branchId ? branchMap.get(t.branchId) || null : null;
      const isBooking = !t.cashierId && t.items?.some((i: any) => i.serviceSessions?.some((s: any) => s.bookingId));
      const cashier = t.cashierId
        ? (cashierMap[t.cashierId] || { id: t.cashierId, name: t.cashierId })
        : (isBooking ? { id: "online-booking", name: "Booking Online" } : null);

      const txVouchers = voucherMap[t.id] || [];
      const hasGeneratedVouchers = txVouchers.length > 0;
      const usedVouchers = txVouchers.filter((v: any) => {
        const hasRedemptions = Boolean(v.redemptions && v.redemptions.length > 0);
        const isNotActive = v.status !== "ACTIVE";
        const visitUsed =
          v.initialVisitCount != null &&
          v.remainingVisitCount != null &&
          v.remainingVisitCount < v.initialVisitCount;
        const creditUsed =
          v.initialCreditAmount != null &&
          v.remainingCreditAmount != null &&
          Number(v.remainingCreditAmount) < Number(v.initialCreditAmount);
        return hasRedemptions || isNotActive || visitUsed || creditUsed;
      });
      const hasRedeemedVouchers = usedVouchers.length > 0;

      return {
        ...t,
        branch,
        branchName: branch ? branch.name : t.branchId,
        cashier,
        cashierName: cashier?.name || t.cashierId || (isBooking ? "Booking Online" : null),
        hasGeneratedVouchers,
        hasRedeemedVouchers,
        totalGeneratedVouchers: txVouchers.length,
        usedGeneratedVouchersCount: usedVouchers.length,
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
      };
    });

    return {
      data: serializedData,
      summary,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}
