import { prisma } from "@/lib/prisma";

export const BookingListRepository = {
  async getBranchBySlug(branchSlug: string) {
    return await prisma.branch.findUnique({
      where: { subdomain: branchSlug },
      select: { id: true }
    });
  },

  async getRoomsByBranch(branchId: string) {
    return await prisma.room.findMany({
      where: { branchId }
    });
  },

  async getBookings(andConditions: any[]) {
    return await prisma.booking.findMany({
      where: { AND: andConditions },
      include: {
        customer: true,
        items: true,
        serviceSessions: {
          include: {
            staff: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  },

  async updateBookingStatus(bookingId: string, status: 'PROCESSED' | 'CANCELLED') {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id: bookingId },
        data: { status },
        include: {
          items: true,
          serviceSessions: true
        }
      });

      if (status === 'CANCELLED') {
        await tx.serviceSession.updateMany({
          where: { bookingId },
          data: { status: 'CANCELLED' }
        });
      } else if (status === 'PROCESSED') {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
        const transactionNumber = `TX-${dateStr}-${randomStr}`;

        const subtotal = booking.items.reduce((acc, item) => acc + Number(item.subtotal), 0);

        const transaction = await tx.transaction.create({
          data: {
            branchId: booking.branchId,
            customerId: booking.customerId,
            transactionNumber,
            subtotal,
            totalAmount: booking.totalAmount,
            status: 'PENDING',
          }
        });

        for (const item of booking.items) {
          const txItem = await tx.transactionItem.create({
            data: {
              transactionId: transaction.id,
              type: 'SERVICE',
              serviceId: item.serviceId,
              itemNameSnapshot: item.itemNameSnapshot,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
            }
          });

          for (const session of booking.serviceSessions) {
            if (session.serviceId === item.serviceId && !(session as any)._linked) {
              await tx.serviceSession.update({
                where: { id: session.id },
                data: { transactionItemId: txItem.id }
              });
              (session as any)._linked = true;
            }
          }
        }
      }

      return booking;
    });
  }
};
