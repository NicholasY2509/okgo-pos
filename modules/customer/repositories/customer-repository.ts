import { prisma } from "@/lib/prisma";
import { CustomerInput } from "../schemas/customer-schema";
import { Prisma } from "@/lib/generated/prisma";

export const CustomerRepository = {
  async create(data: CustomerInput) {
    return await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
      },
    });
  },

  async update(id: string, data: CustomerInput) {
    return await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
      },
    });
  },

  async getAll() {
    return await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async findManyWithFilter(whereClause: Prisma.CustomerWhereInput, skip: number, limit: number) {
    return await prisma.customer.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { name: "asc" },
    });
  },

  async count(whereClause: Prisma.CustomerWhereInput) {
    return await prisma.customer.count({
      where: whereClause,
    });
  },

  async getById(id: string) {
    return await prisma.customer.findUnique({
      where: { id },
      include: {
        vouchers: {
          include: {
            voucherPacket: true
          }
        },
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  },

  async getCustomerTransactions(customerId: string, skip: number, limit: number) {
    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { customerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transaction.count({
        where: { customerId }
      })
    ]);
    return { data, total };
  },

  async delete(id: string) {
    return await prisma.customer.delete({
      where: { id },
    });
  },

  async getDirectory(whereClause: Prisma.CustomerWhereInput, skip: number, limit: number) {
    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              transactions: true,
              bookings: true,
              vouchers: {
                where: { status: "ACTIVE" },
              },
            },
          },
        },
      }),
      prisma.customer.count({ where: whereClause }),
    ]);

    return { data, total };
  },

  async getDetailSummary(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
            bookings: true,
            vouchers: true,
          },
        },
      },
    });

    if (!customer) return null;

    const [activeVoucherCount, serviceSessionCount] = await Promise.all([
      prisma.customerVoucher.count({
        where: { customerId: id, status: "ACTIVE" },
      }),
      prisma.serviceSession.count({
        where: {
          OR: [
            { customerId: id },
            { transactionItem: { transaction: { customerId: id } } },
            { booking: { customerId: id } },
          ],
        },
      }),
    ]);

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        createdAt: customer.createdAt,
      },
      counts: {
        activeVoucherCount,
        totalVoucherCount: customer._count.vouchers,
        transactionCount: customer._count.transactions,
        bookingCount: customer._count.bookings,
        serviceSessionCount,
      },
    };
  },

  async getCustomerVouchers(params: {
    customerId: string;
    statusFilter?: "ALL" | "ACTIVE" | "INACTIVE";
    skip: number;
    limit: number;
  }) {
    const { customerId, statusFilter = "ALL", skip, limit } = params;
    const where: Prisma.CustomerVoucherWhereInput = {
      customerId,
      ...(statusFilter === "ACTIVE"
        ? { status: "ACTIVE" }
        : statusFilter === "INACTIVE"
          ? { status: { not: "ACTIVE" } }
          : {}),
    };

    const [data, total] = await Promise.all([
      prisma.customerVoucher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          voucherPacket: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
          redemptions: {
            orderBy: { redeemedAt: "desc" },
            include: {
              transaction: {
                select: {
                  id: true,
                  transactionNumber: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
      prisma.customerVoucher.count({ where }),
    ]);

    return { data, total };
  },

  async getCustomerActivities(params: {
    customerId: string;
    type?: "ALL" | "TRANSACTION" | "SESSION" | "BOOKING";
    dateFrom?: Date;
    dateTo?: Date;
    skip: number;
    limit: number;
  }) {
    const { customerId, type = "ALL", dateFrom, dateTo, skip, limit } = params;

    const dateRange =
      dateFrom && dateTo ? { gte: dateFrom, lte: dateTo } : undefined;

    const txWhere: Prisma.TransactionWhereInput = {
      customerId,
      ...(dateRange ? { createdAt: dateRange } : {}),
    };

    const bookingWhere: Prisma.BookingWhereInput = {
      customerId,
      ...(dateRange
        ? {
            OR: [
              { scheduledStartTime: dateRange },
              { scheduledStartTime: null, createdAt: dateRange },
            ],
          }
        : {}),
    };

    const sessionWhere: Prisma.ServiceSessionWhereInput = {
      AND: [
        {
          OR: [
            { customerId },
            { transactionItem: { transaction: { customerId } } },
            { booking: { customerId } },
          ],
        },
        ...(dateRange
          ? [
              {
                OR: [
                  { actualStartTime: dateRange },
                  { actualStartTime: null, startTime: dateRange },
                  { actualStartTime: null, startTime: null, createdAt: dateRange },
                ],
              },
            ]
          : []),
      ],
    };

    const fetchTransactions = async (take: number, txSkip: number) =>
      prisma.transaction.findMany({
        where: txWhere,
        skip: txSkip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          payments: {
            include: {
              paymentMethod: { select: { id: true, name: true, type: true } },
            },
          },
          voucherRedemptions: {
            include: {
              customerVoucher: { select: { id: true, code: true } },
            },
          },
        },
      });

    const fetchBookings = async (take: number, bkSkip: number) =>
      prisma.booking.findMany({
        where: bookingWhere,
        skip: bkSkip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          appliedVoucher: { select: { id: true, code: true } },
        },
      });

    const fetchSessions = async (take: number, sessSkip: number) => {
      const sessions = await prisma.serviceSession.findMany({
        where: sessionWhere,
        skip: sessSkip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          staff: { select: { id: true, firstName: true, lastName: true } },
          transactionItem: {
            select: {
              id: true,
              itemNameSnapshot: true,
              transaction: {
                select: { id: true, transactionNumber: true, status: true },
              },
            },
          },
          booking: { select: { id: true, bookingNumber: true, status: true } },
        },
      });

      const serviceIds = Array.from(new Set(sessions.map((s) => s.serviceId).filter(Boolean)));
      const roomIds = Array.from(new Set(sessions.map((s) => s.roomId).filter(Boolean)));

      const [products, rooms] = await Promise.all([
        serviceIds.length > 0
          ? prisma.product.findMany({
              where: { id: { in: serviceIds } },
              select: { id: true, name: true },
            })
          : Promise.resolve([]),
        roomIds.length > 0
          ? prisma.room.findMany({
              where: { id: { in: roomIds } },
              select: { id: true, name: true },
            })
          : Promise.resolve([]),
      ]);

      const productMap = new Map(products.map((p) => [p.id, p.name]));
      const roomMap = new Map(rooms.map((r) => [r.id, r.name]));

      return sessions.map((s) => ({
        ...s,
        serviceName: s.transactionItem?.itemNameSnapshot || productMap.get(s.serviceId) || "Layanan",
        roomName: roomMap.get(s.roomId) || null,
      }));
    };

    if (type === "TRANSACTION") {
      const [transactions, total] = await Promise.all([
        fetchTransactions(limit, skip),
        prisma.transaction.count({ where: txWhere }),
      ]);
      return { transactions, sessions: [], bookings: [], total };
    }

    if (type === "SESSION") {
      const [sessions, total] = await Promise.all([
        fetchSessions(limit, skip),
        prisma.serviceSession.count({ where: sessionWhere }),
      ]);
      return { transactions: [], sessions, bookings: [], total };
    }

    if (type === "BOOKING") {
      const [bookings, total] = await Promise.all([
        fetchBookings(limit, skip),
        prisma.booking.count({ where: bookingWhere }),
      ]);
      return { transactions: [], sessions: [], bookings, total };
    }

    const windowSize = skip + limit;
    const [txCount, sessCount, bkCount, transactions, sessions, bookings] = await Promise.all([
      prisma.transaction.count({ where: txWhere }),
      prisma.serviceSession.count({ where: sessionWhere }),
      prisma.booking.count({ where: bookingWhere }),
      fetchTransactions(windowSize, 0),
      fetchSessions(windowSize, 0),
      fetchBookings(windowSize, 0),
    ]);

    return {
      transactions,
      sessions,
      bookings,
      total: txCount + sessCount + bkCount,
    };
  },
};
