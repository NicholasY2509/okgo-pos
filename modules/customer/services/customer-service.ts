import { CustomerInput } from "../schemas/customer-schema";
import { CustomerRepository } from "../repositories/customer-repository";

export class CustomerService {
  static async create(data: CustomerInput) {
    return await CustomerRepository.create(data);
  }

  static async update(id: string, data: CustomerInput) {
    return await CustomerRepository.update(id, data);
  }

  static async getAll() {
    return await CustomerRepository.getAll();
  }

  static async searchCustomers(query: string = "", page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const whereClause = query
      ? {
          OR: [
            { name: { contains: query } },
            { phone: { contains: query } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      CustomerRepository.findManyWithFilter(whereClause, skip, limit),
      CustomerRepository.count(whereClause),
    ]);

    return {
      data,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  static async getById(id: string) {
    return await CustomerRepository.getById(id);
  }

  static async getCustomerTransactions(customerId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const { data, total } = await CustomerRepository.getCustomerTransactions(customerId, skip, limit);
    
    return {
      data,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  static async delete(id: string) {
    return await CustomerRepository.delete(id);
  }

  static async getDirectory(query: string = "", page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const trimmed = query.trim();

    const whereClause = trimmed
      ? {
          OR: [
            { name: { contains: trimmed } },
            { phone: { contains: trimmed } },
            { email: { contains: trimmed } },
          ],
        }
      : {};

    const { data, total } = await CustomerRepository.getDirectory(whereClause, skip, limit);

    return {
      data: data.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        createdAt: c.createdAt.toISOString(),
        activeVoucherCount: c._count.vouchers,
        transactionCount: c._count.transactions,
        bookingCount: c._count.bookings,
      })),
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasMore: page * limit < total,
      },
    };
  }

  static async getDetailWithActivity(id: string) {
    const summary = await CustomerRepository.getDetailSummary(id);
    if (!summary) return null;

    const [vouchersPage, activitiesPage] = await Promise.all([
      CustomerService.getCustomerVouchers({
        customerId: id,
        statusFilter: "ALL",
        page: 1,
        limit: 10,
      }),
      CustomerService.getCustomerActivities({
        customerId: id,
        type: "ALL",
        page: 1,
        limit: 10,
      }),
    ]);

    return {
      customer: {
        id: summary.customer.id,
        name: summary.customer.name,
        phone: summary.customer.phone,
        email: summary.customer.email,
        createdAt: summary.customer.createdAt.toISOString(),
      },
      counts: summary.counts,
      initialVouchers: vouchersPage,
      initialActivities: activitiesPage,
    };
  }

  static async getCustomerVouchers(params: {
    customerId: string;
    statusFilter?: "ALL" | "ACTIVE" | "INACTIVE";
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, params.limit ?? 10);
    const skip = (page - 1) * limit;

    const { data, total } = await CustomerRepository.getCustomerVouchers({
      customerId: params.customerId,
      statusFilter: params.statusFilter ?? "ALL",
      skip,
      limit,
    });

    return {
      data: data.map((v) => ({
        id: v.id,
        code: v.code,
        status: v.status,
        initialVisitCount: v.initialVisitCount,
        remainingVisitCount: v.remainingVisitCount,
        initialCreditAmount: v.initialCreditAmount != null ? Number(v.initialCreditAmount) : null,
        remainingCreditAmount: v.remainingCreditAmount != null ? Number(v.remainingCreditAmount) : null,
        expiresAt: v.expiresAt ? v.expiresAt.toISOString() : null,
        createdAt: v.createdAt.toISOString(),
        voucherPacket: {
          id: v.voucherPacket.id,
          name: v.voucherPacket.name,
          price: Number(v.voucherPacket.price),
          totalVisitCount: v.voucherPacket.totalVisitCount,
          totalCreditAmount: v.voucherPacket.totalCreditAmount != null ? Number(v.voucherPacket.totalCreditAmount) : null,
          productName: v.voucherPacket.product?.name ?? null,
        },
        redemptions: v.redemptions.map((r) => ({
          id: r.id,
          redeemedVisitCount: r.redeemedVisitCount,
          redeemedAmount: r.redeemedAmount != null ? Number(r.redeemedAmount) : null,
          redeemedAt: r.redeemedAt.toISOString(),
          transactionNumber: r.transaction?.transactionNumber ?? null,
          transactionStatus: r.transaction?.status ?? null,
        })),
      })),
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  static async getCustomerActivities(params: {
    customerId: string;
    type?: "ALL" | "TRANSACTION" | "SESSION" | "BOOKING";
    date?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, params.limit ?? 10);
    const skip = (page - 1) * limit;
    const type = params.type ?? "ALL";

    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;

    if (params.date) {
      const [year, month, day] = params.date.split("-").map(Number);
      if (year && month && day) {
        dateFrom = new Date(year, month - 1, day, 0, 0, 0, 0);
        dateTo = new Date(year, month - 1, day, 23, 59, 59, 999);
      }
    }

    const { transactions, sessions, bookings, total } =
      await CustomerRepository.getCustomerActivities({
        customerId: params.customerId,
        type,
        dateFrom,
        dateTo,
        skip: type === "ALL" ? skip : skip,
        limit,
      });

    const normalized: Array<{
      id: string;
      kind: "TRANSACTION" | "SESSION" | "BOOKING";
      date: string;
      title: string;
      status: string;
      payload: any;
    }> = [];

    for (const t of transactions) {
      normalized.push({
        id: `tx-${t.id}`,
        kind: "TRANSACTION",
        date: t.createdAt.toISOString(),
        title: `Transaksi ${t.transactionNumber}`,
        status: t.status,
        payload: {
          totalAmount: Number(t.totalAmount),
          paidAmount: Number(t.paidAmount),
          discountTotal: Number(t.discountTotal),
          items: t.items.map((item) => ({
            id: item.id,
            type: item.type,
            itemNameSnapshot: item.itemNameSnapshot,
            quantity: item.quantity,
            subtotal: Number(item.subtotal),
          })),
          payments: t.payments.map((p) => ({
            id: p.id,
            amount: Number(p.amount),
            methodName: p.paymentMethod?.name ?? "Lainnya",
            methodType: p.paymentMethod?.type ?? "",
          })),
          voucherCodes: t.voucherRedemptions
            .map((vr) => vr.customerVoucher?.code)
            .filter(Boolean) as string[],
        },
      });
    }

    for (const s of sessions) {
      const dateObj = s.actualStartTime || s.startTime || s.createdAt;
      normalized.push({
        id: `sess-${s.id}`,
        kind: "SESSION",
        date: dateObj.toISOString(),
        title: `Sesi Layanan: ${s.serviceName}`,
        status: s.status,
        payload: {
          roomName: s.roomName,
          staffName: s.staff ? `${s.staff.firstName} ${s.staff.lastName || ""}`.trim() : null,
          transactionNumber: s.transactionItem?.transaction?.transactionNumber ?? null,
          bookingNumber: s.booking?.bookingNumber ?? null,
          rating: s.rating,
          reviewComment: s.reviewComment,
        },
      });
    }

    for (const b of bookings) {
      const dateObj = b.scheduledStartTime || b.createdAt;
      normalized.push({
        id: `book-${b.id}`,
        kind: "BOOKING",
        date: dateObj.toISOString(),
        title: `Booking ${b.bookingNumber}`,
        status: b.status,
        payload: {
          totalAmount: Number(b.totalAmount),
          appliedVoucherCode: b.appliedVoucher?.code ?? null,
          items: b.items.map((item) => ({
            id: item.id,
            itemNameSnapshot: item.itemNameSnapshot,
            quantity: item.quantity,
            subtotal: Number(item.subtotal),
          })),
        },
      });
    }

    normalized.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const pagedData = type === "ALL" ? normalized.slice(skip, skip + limit) : normalized;

    return {
      data: pagedData,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}
