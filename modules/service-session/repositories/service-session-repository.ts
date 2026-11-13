import { prisma } from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma"

export interface GetServiceSessionsParams {
  branchId: string
  search?: string
  status?: string
  roomId?: string
  staffId?: string
  date?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export const ServiceSessionRepository = {
  async getServiceSessions(params: GetServiceSessionsParams) {
    const where: Prisma.ServiceSessionWhereInput = {
      branchId: params.branchId,
    }

    if (params.status && params.status !== "ALL") {
      where.status = params.status
    }

    if (params.roomId && params.roomId !== "ALL") {
      where.roomId = params.roomId
    }

    if (params.staffId && params.staffId !== "ALL") {
      where.staffId = params.staffId
    }

    let dateCondition: Prisma.ServiceSessionWhereInput | undefined

    if (params.date) {
      const [year, month, day] = params.date.split("-").map(Number)
      if (year && month && day) {
        const start = new Date(year, month - 1, day, 0, 0, 0, 0)
        const end = new Date(year, month - 1, day, 23, 59, 59, 999)
        dateCondition = {
          OR: [
            { startTime: { gte: start, lte: end } },
            { AND: [{ startTime: null }, { createdAt: { gte: start, lte: end } }] },
          ],
        }
      }
    } else if (params.startDate || params.endDate) {
      const start = params.startDate ? new Date(params.startDate) : undefined
      const end = params.endDate ? new Date(params.endDate) : undefined
      const dateFilter: Prisma.DateTimeFilter = {}
      if (start) dateFilter.gte = start
      if (end) dateFilter.lte = end
      dateCondition = {
        OR: [
          { startTime: dateFilter },
          { AND: [{ startTime: null }, { createdAt: dateFilter }] },
        ],
      }
    }

    let searchCondition: Prisma.ServiceSessionWhereInput | undefined

    if (params.search && params.search.trim() !== "") {
      const s = params.search.trim()

      const matchingRooms = await prisma.room.findMany({
        where: { branchId: params.branchId, name: { contains: s } },
        select: { id: true },
      })
      const matchingRoomIds = matchingRooms.map((r) => r.id)

      const matchingProducts = await prisma.product.findMany({
        where: { name: { contains: s } },
        select: { id: true },
      })
      const matchingProductIds = matchingProducts.map((p) => p.id)

      searchCondition = {
        OR: [
          { staff: { firstName: { contains: s } } },
          { staff: { lastName: { contains: s } } },
          { booking: { bookingNumber: { contains: s } } },
          { booking: { customerName: { contains: s } } },
          { booking: { customerPhone: { contains: s } } },
          { booking: { customer: { name: { contains: s } } } },
          { booking: { customer: { phone: { contains: s } } } },
          { transactionItem: { itemNameSnapshot: { contains: s } } },
          { transactionItem: { transaction: { transactionNumber: { contains: s } } } },
          { transactionItem: { transaction: { customer: { name: { contains: s } } } } },
          { transactionItem: { transaction: { customer: { phone: { contains: s } } } } },
          ...(matchingRoomIds.length > 0 ? [{ roomId: { in: matchingRoomIds } }] : []),
          ...(matchingProductIds.length > 0 ? [{ serviceId: { in: matchingProductIds } }] : []),
        ],
      }
    }

    const andConditions: Prisma.ServiceSessionWhereInput[] = []
    if (dateCondition) andConditions.push(dateCondition)
    if (searchCondition) andConditions.push(searchCondition)

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    const page = params.page && params.page > 0 ? params.page : 1
    const limit = params.limit && params.limit > 0 ? params.limit : 10
    const skip = (page - 1) * limit

    const [total, sessions, stats] = await Promise.all([
      prisma.serviceSession.count({ where }),
      prisma.serviceSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ startTime: "desc" }, { createdAt: "desc" }],
        include: {
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          transactionItem: {
            include: {
              transaction: {
                select: {
                  id: true,
                  transactionNumber: true,
                  status: true,
                  customer: {
                    select: {
                      id: true,
                      name: true,
                      phone: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
          booking: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  email: true,
                },
              },
              items: true,
            },
          },
        },
      }),
      Promise.all([
        prisma.serviceSession.count({
          where: {
            branchId: params.branchId,
            ...(dateCondition ? { AND: [dateCondition] } : {}),
          },
        }),
        prisma.serviceSession.count({
          where: {
            branchId: params.branchId,
            status: "IN_PROGRESS",
            ...(dateCondition ? { AND: [dateCondition] } : {}),
          },
        }),
        prisma.serviceSession.count({
          where: {
            branchId: params.branchId,
            status: "SCHEDULED",
            ...(dateCondition ? { AND: [dateCondition] } : {}),
          },
        }),
        prisma.serviceSession.count({
          where: {
            branchId: params.branchId,
            status: "COMPLETED",
            ...(dateCondition ? { AND: [dateCondition] } : {}),
          },
        }),
        prisma.serviceSession.count({
          where: {
            branchId: params.branchId,
            status: "CANCELLED",
            ...(dateCondition ? { AND: [dateCondition] } : {}),
          },
        }),
      ]),
    ])

    const [totalBranchSessions, inProgressCount, scheduledCount, completedCount, cancelledCount] =
      stats

    const roomIds = [...new Set(sessions.map((s) => s.roomId).filter(Boolean))]
    const rooms =
      roomIds.length > 0
        ? await prisma.room.findMany({ where: { id: { in: roomIds } } })
        : []
    const roomMap = new Map(rooms.map((r) => [r.id, r]))

    const serviceIds = [...new Set(sessions.map((s) => s.serviceId).filter(Boolean))]
    const products =
      serviceIds.length > 0
        ? await prisma.product.findMany({ where: { id: { in: serviceIds } } })
        : []
    const productMap = new Map(products.map((p) => [p.id, p]))

    const customerIds = [
      ...new Set(sessions.map((s) => s.customerId).filter(Boolean)),
    ] as string[]
    const customers =
      customerIds.length > 0
        ? await prisma.customer.findMany({ where: { id: { in: customerIds } } })
        : []
    const customerMap = new Map(customers.map((c) => [c.id, c]))

    const mappedSessions = sessions.map((s) => {
      const serviceProduct = productMap.get(s.serviceId) || null
      const room = roomMap.get(s.roomId) || { id: s.roomId, name: s.roomId, isVip: false }
      const customer =
        s.transactionItem?.transaction?.customer ||
        s.booking?.customer ||
        (s.customerId ? customerMap.get(s.customerId) : null) ||
        (s.booking?.customerName
          ? {
              id: s.booking.customerId || "",
              name: s.booking.customerName,
              phone: s.booking.customerPhone || null,
              email: null,
            }
          : null)

      const serviceName =
        serviceProduct?.name ||
        s.transactionItem?.itemNameSnapshot ||
        s.booking?.items?.find((i) => i.serviceId === s.serviceId)?.itemNameSnapshot ||
        "Layanan"

      const servicePrice =
        s.transactionItem?.unitPrice != null
          ? Number(s.transactionItem.unitPrice)
          : s.booking?.items?.find((i) => i.serviceId === s.serviceId)?.unitPrice != null
          ? Number(s.booking.items.find((i) => i.serviceId === s.serviceId)!.unitPrice)
          : serviceProduct?.price != null
          ? Number(serviceProduct.price)
          : null

      const staffName = s.staff
        ? `${s.staff.firstName} ${s.staff.lastName || ""}`.trim()
        : null

      return {
        id: s.id,
        branchId: s.branchId,
        roomId: s.roomId,
        roomName: room.name,
        roomIsVip: room.isVip ?? false,
        serviceId: s.serviceId,
        serviceName,
        servicePrice,
        serviceDuration: serviceProduct?.duration ?? null,
        status: s.status,
        startTime: s.startTime,
        endTime: s.endTime,
        actualStartTime: s.actualStartTime,
        actualEndTime: s.actualEndTime,
        staffId: s.staffId,
        staffName,
        staffPhone: s.staff?.phone || null,
        customer,
        bookingId: s.bookingId,
        bookingNumber: s.booking?.bookingNumber || null,
        bookingStatus: s.booking?.status || null,
        transactionItemId: s.transactionItemId,
        transactionId: s.transactionItem?.transaction?.id || null,
        transactionNumber: s.transactionItem?.transaction?.transactionNumber || null,
        transactionStatus: s.transactionItem?.transaction?.status || null,
        rating: s.rating,
        reviewComment: s.reviewComment,
        therapistCommissionAmount: s.therapistCommissionAmount
          ? Number(s.therapistCommissionAmount)
          : 0,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }
    })

    return {
      items: mappedSessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary: {
        totalSessions: totalBranchSessions,
        inProgress: inProgressCount,
        scheduled: scheduledCount,
        completed: completedCount,
        cancelled: cancelledCount,
      },
    }
  },

  async getServiceSessionFilterOptions(branchId: string) {
    const rooms = await prisma.room.findMany({
      where: { branchId },
      select: { id: true, name: true, isVip: true },
      orderBy: { name: "asc" },
    })

    const branchStaffs = await prisma.branchStaff.findMany({
      where: { branchId },
      include: {
        staff: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    const staffMap = new Map<string, { id: string; name: string }>()
    branchStaffs.forEach((bs) => {
      if (bs.staff) {
        staffMap.set(bs.staff.id, {
          id: bs.staff.id,
          name: `${bs.staff.firstName} ${bs.staff.lastName || ""}`.trim(),
        })
      }
    })

    const sessionStaff = await prisma.serviceSession.findMany({
      where: { branchId, staffId: { not: null } },
      select: {
        staff: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      distinct: ["staffId"],
    })

    sessionStaff.forEach((s) => {
      if (s.staff && !staffMap.has(s.staff.id)) {
        staffMap.set(s.staff.id, {
          id: s.staff.id,
          name: `${s.staff.firstName} ${s.staff.lastName || ""}`.trim(),
        })
      }
    })

    const staffList = Array.from(staffMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )

    return {
      rooms,
      staffList,
    }
  },
  async getStaffDailySessions(staffId: string) {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const sessions = await prisma.serviceSession.findMany({
      where: {
        staffId,
        status: { in: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] },
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      orderBy: { createdAt: "asc" },
      include: {
        staff: true,
        transactionItem: {
          include: {
            transaction: {
              include: {
                customer: true
              }
            }
          }
        },
        booking: {
          include: {
            customer: true
          }
        },
      }
    })

    const roomIds = [...new Set(sessions.map(s => s.roomId))]
    const rooms = await prisma.room.findMany({ where: { id: { in: roomIds } } })
    const roomMap = new Map(rooms.map(r => [r.id, r.name]))

    return sessions.map(s => ({
      ...s,
      roomName: roomMap.get(s.roomId) || s.roomId
    }))
  },

  async startSession(sessionId: string) {
    return await prisma.serviceSession.update({
      where: { id: sessionId },
      data: {
        status: "IN_PROGRESS",
        actualStartTime: new Date(),
      }
    })
  },

  async getById(sessionId: string) {
    return await prisma.serviceSession.findUnique({
      where: { id: sessionId },
      include: { transactionItem: true },
    })
  },

  async endSession(sessionId: string, commissionAmount: number = 0, staffId?: string | null, gross: number = 0) {
    return await prisma.$transaction(async (tx) => {
      const session = await tx.serviceSession.update({
        where: { id: sessionId },
        data: {
          status: "COMPLETED",
          actualEndTime: new Date(),
          therapistCommissionAmount: commissionAmount,
        }
      });

      if (commissionAmount > 0 && staffId) {
        await tx.staffIncentive.create({
          data: {
            staffId: staffId,
            amount: commissionAmount,
            gross: gross,
            type: "SERVICE_COMMISSION",
            description: `Commission for service session`,
            serviceSessionId: sessionId,
          }
        });
      }

      return session;
    });
  },

  async getDailyReviewableSessions(tenantId: string) {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    return await prisma.serviceSession.findMany({
      where: {
        branchId: tenantId, // Assuming tenantId maps to branchId in this context
        status: "COMPLETED",
        rating: null,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      orderBy: { actualEndTime: "desc" },
      include: {
        staff: true,
        transactionItem: {
          include: {
            transaction: {
              include: { customer: true }
            }
          }
        }
      }
    })
  },

  async submitReview(sessionId: string, rating: number, reviewComment?: string) {
    return await prisma.serviceSession.update({
      where: { id: sessionId },
      data: {
        rating,
        reviewComment,
      }
    })
  }
}
