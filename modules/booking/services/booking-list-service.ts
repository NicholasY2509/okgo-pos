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

    const bookings = await prisma.transaction.findMany({
      where: {
        branchId: branch.id,
        status: 'PENDING'
      },
      include: {
        customer: true,
        items: {
          include: {
            serviceSessions: {
              include: {
                staff: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Attach room name manually and convert Decimals to numbers
    return bookings.map(booking => ({
      ...booking,
      totalAmount: booking.totalAmount ? Number(booking.totalAmount) : 0,
      paidAmount: booking.paidAmount ? Number(booking.paidAmount) : 0,
      subtotal: booking.subtotal ? Number(booking.subtotal) : 0,
      discountTotal: booking.discountTotal ? Number(booking.discountTotal) : 0,
      items: booking.items.map(item => ({
        ...item,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
        discountAmount: item.discountAmount ? Number(item.discountAmount) : 0,
        subtotal: item.subtotal ? Number(item.subtotal) : 0,
        serviceSessions: item.serviceSessions.map(session => ({
          ...session,
          room: { name: roomMap.get(session.roomId) || "Room Unknown" }
        }))
      }))
    }));
  }
}
