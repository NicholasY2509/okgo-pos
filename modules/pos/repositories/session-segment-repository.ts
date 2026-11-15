import { prisma } from "@/lib/prisma";

export const SessionSegmentRepository = {
  async getSessionWithSegments(sessionId: string) {
    return await prisma.serviceSession.findUnique({
      where: { id: sessionId },
      include: {
        segments: {
          orderBy: { sequenceOrder: "asc" },
          include: {
            staff: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        transactionItem: {
          include: {
            transaction: true,
          },
        },
      },
    });
  },

  async getServiceAndStaff(serviceId: string, staffId: string, roomId?: string) {
    const [product, staff, room] = await Promise.all([
      prisma.product.findUnique({ where: { id: serviceId } }),
      prisma.staff.findUnique({
        where: { id: staffId },
        include: {
          workPosition: {
            include: {
              incentiveRules: {
                where: { isActive: true },
              },
            },
          },
        },
      }),
      roomId ? prisma.room.findUnique({ where: { id: roomId } }) : Promise.resolve(null),
    ]);
    return { product, staff, room };
  },

  async addContinuationSegment(params: {
    sessionId: string;
    serviceId: string;
    staffId: string;
    roomId: string;
    productName: string;
    unitPrice: number;
    durationMinutes: number;
    sequenceOrder: number;
    startTime: Date;
    endTime: Date;
    commissionAmount: number;
    transactionId: string | null;
    transactionStatus: string | null;
    transactionPaidAmount: number;
    transactionSubtotal: number;
    transactionTotalAmount: number;
  }) {
    return await prisma.$transaction(async (tx) => {
      let createdTransactionItemId: string | null = null;

      if (params.transactionId) {
        const createdItem = await tx.transactionItem.create({
          data: {
            transactionId: params.transactionId,
            type: "SERVICE",
            serviceId: params.serviceId,
            itemNameSnapshot: params.productName,
            unitPrice: params.unitPrice,
            quantity: 1,
            discountAmount: 0,
            subtotal: params.unitPrice,
            cashierIncentiveAmount: 0,
          },
        });
        createdTransactionItemId = createdItem.id;

        const newSubtotal = params.transactionSubtotal + params.unitPrice;
        const newTotalAmount = params.transactionTotalAmount + params.unitPrice;
        const nextStatus =
          params.transactionStatus === "COMPLETED" && params.transactionPaidAmount < newTotalAmount
            ? "PENDING"
            : params.transactionStatus || "PENDING";

        await tx.transaction.update({
          where: { id: params.transactionId },
          data: {
            subtotal: newSubtotal,
            totalAmount: newTotalAmount,
            status: nextStatus as any,
          },
        });
      }

      const segment = await tx.serviceSessionSegment.create({
        data: {
          serviceSessionId: params.sessionId,
          sequenceOrder: params.sequenceOrder,
          serviceId: params.serviceId,
          staffId: params.staffId,
          roomId: params.roomId,
          transactionItemId: createdTransactionItemId,
          status: "SCHEDULED",
          switchReason: "CONTINUATION",
          durationMinutes: params.durationMinutes,
          startTime: params.startTime,
          endTime: params.endTime,
          therapistCommissionAmount: params.commissionAmount,
        },
      });

      if (params.commissionAmount > 0) {
        await tx.staffIncentive.create({
          data: {
            staffId: params.staffId,
            amount: params.commissionAmount,
            gross: params.unitPrice,
            type: "SERVICE_COMMISSION",
            description: `Commission for service: ${params.productName}`,
            transactionItemId: createdTransactionItemId,
            serviceSessionId: params.sessionId,
            serviceSessionSegmentId: segment.id,
          },
        });
      }

      await tx.serviceSession.update({
        where: { id: params.sessionId },
        data: {
          endTime: params.endTime,
        },
      });

      return segment;
    });
  },

  async switchActiveSegment(params: {
    sessionId: string;
    activeSegmentId: string;
    newSequenceOrder: number;
    newServiceId: string;
    newStaffId: string;
    newRoomId: string;
    isSameStaff: boolean;
    remainingMinutes: number;
    now: Date;
    newEndTime: Date;
    transactionItemId: string | null;
  }) {
    return await prisma.$transaction(async (tx) => {
      await tx.serviceSessionSegment.update({
        where: { id: params.activeSegmentId },
        data: {
          status: "COMPLETED",
          actualEndTime: params.now,
          endTime: params.now,
        },
      });

      const nextSegment = await tx.serviceSessionSegment.create({
        data: {
          serviceSessionId: params.sessionId,
          sequenceOrder: params.newSequenceOrder,
          serviceId: params.newServiceId,
          staffId: params.newStaffId,
          roomId: params.newRoomId,
          transactionItemId: params.transactionItemId,
          status: params.isSameStaff ? "IN_PROGRESS" : "SCHEDULED",
          switchReason: "MID_SESSION_SWITCH",
          durationMinutes: params.remainingMinutes,
          startTime: params.now,
          endTime: params.newEndTime,
          actualStartTime: params.isSameStaff ? params.now : null,
          therapistCommissionAmount: 0,
        },
      });

      await tx.serviceSession.update({
        where: { id: params.sessionId },
        data: {
          serviceId: params.newServiceId,
          staffId: params.newStaffId,
          roomId: params.newRoomId,
          endTime: params.newEndTime,
        },
      });

      return nextSegment;
    });
  },

  async startSegment(params: {
    sessionId: string;
    segmentId: string;
    serviceId: string;
    staffId: string | null;
    roomId?: string | null;
    now: Date;
  }) {
    return await prisma.$transaction(async (tx) => {
      await tx.serviceSessionSegment.updateMany({
        where: {
          serviceSessionId: params.sessionId,
          status: "IN_PROGRESS",
          id: { not: params.segmentId },
        },
        data: {
          status: "COMPLETED",
          actualEndTime: params.now,
        },
      });

      const updatedSegment = await tx.serviceSessionSegment.update({
        where: { id: params.segmentId },
        data: {
          status: "IN_PROGRESS",
          actualStartTime: params.now,
        },
      });

      await tx.serviceSession.update({
        where: { id: params.sessionId },
        data: {
          status: "IN_PROGRESS",
          serviceId: params.serviceId,
          ...(params.staffId ? { staffId: params.staffId } : {}),
          ...(params.roomId ? { roomId: params.roomId } : {}),
        },
      });

      return updatedSegment;
    });
  },
};
