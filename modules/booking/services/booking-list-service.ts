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
        data: { status }
      });

      if (status === 'CANCELLED') {
        // Cancel all associated service sessions
        await tx.serviceSession.updateMany({
          where: { bookingId },
          data: { status: 'CANCELLED' }
        });
      }
      
      // If PROCESSED, maybe we update sessions to IN_PROGRESS? The user only mentioned marking booking as PROCESSED.
      // Usually, session status might be managed individually, but since the customer arrived, IN_PROGRESS makes sense or we leave it SCHEDULED until they start. Let's leave session status alone for PROCESSED, except maybe updating it if needed later.

      return booking;
    });
  }
}
