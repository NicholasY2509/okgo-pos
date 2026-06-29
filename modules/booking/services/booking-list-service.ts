import { prisma } from "@/lib/prisma";

export class BookingListService {
  static async getBookings(branchSlug: string) {
    const branch = await prisma.branch.findUnique({
      where: { subdomain: branchSlug },
      select: { id: true }
    });

    if (!branch) throw new Error("Cabang tidak ditemukan");

    const rooms = await prisma.room.findMany({
      where: { branchId: branch.id }
    });
    const roomMap = new Map(rooms.map(r => [r.id, r.name]));

    const bookings = await prisma.booking.findMany({
      where: {
        branchId: branch.id,
        status: { in: ['PENDING', 'PROCESSED'] }
      },
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

    const mappedBookings = bookings.map(booking => ({
      ...booking,
      totalAmount: booking.totalAmount ? Number(booking.totalAmount) : 0,
      items: booking.items.map(item => ({
        ...item,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
        subtotal: item.subtotal ? Number(item.subtotal) : 0,
      })),
      serviceSessions: booking.serviceSessions.map(session => ({
        ...session,
        room: { name: roomMap.get(session.roomId) || "Room Unknown" }
      }))
    }));

    mappedBookings.sort((a, b) => {
      let aTime: number | null = null;
      let bTime: number | null = null;

      a.serviceSessions.forEach((s: any) => {
        if (s.startTime) {
          const t = new Date(s.startTime).getTime();
          if (!aTime || t < aTime) aTime = t;
        }
      });

      b.serviceSessions.forEach((s: any) => {
        if (s.startTime) {
          const t = new Date(s.startTime).getTime();
          if (!bTime || t < bTime) bTime = t;
        }
      });

      const aDate = aTime || new Date(a.createdAt).getTime();
      const bDate = bTime || new Date(b.createdAt).getTime();

      return aDate - bDate;
    });

    return mappedBookings;
  }

  static async updateBookingStatus(bookingId: string, status: 'PROCESSED' | 'CANCELLED') {
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
        // Cancel all associated service sessions
        await tx.serviceSession.updateMany({
          where: { bookingId },
          data: { status: 'CANCELLED' }
        });
      } else if (status === 'PROCESSED') {
        // Create Transaction
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

        // Create TransactionItems and link them
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

          // Link the corresponding ServiceSessions
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
}
