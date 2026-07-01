import { BookingListRepository } from "../repositories/booking-list-repository";

export class BookingListService {
  static async getBookings(branchSlug: string, filters?: { search?: string, from?: Date, to?: Date, isHistory?: boolean }) {
    const branch = await BookingListRepository.getBranchBySlug(branchSlug);

    if (!branch) throw new Error("Cabang tidak ditemukan");

    const rooms = await BookingListRepository.getRoomsByBranch(branch.id);
    const roomMap = new Map(rooms.map(r => [r.id, r.name]));

    const andConditions: any[] = [{ branchId: branch.id }];

    if (filters?.search) {
      andConditions.push({
        OR: [
          { bookingNumber: { contains: filters.search } },
          { customerName: { contains: filters.search } },
          { customer: { name: { contains: filters.search } } }
        ]
      });
    }

    if (filters?.from || filters?.to) {
      const dateFilter: any = {};
      if (filters.from) dateFilter.gte = filters.from;
      if (filters.to) {
        const toEnd = new Date(filters.to);
        toEnd.setHours(23, 59, 59, 999);
        dateFilter.lte = toEnd;
      }
      andConditions.push({
        serviceSessions: { some: { startTime: dateFilter } }
      });
    }

    if (filters?.isHistory) {
      andConditions.push({
        OR: [
          { status: 'CANCELLED' },
          {
            status: 'PROCESSED',
            serviceSessions: {
              some: {
                transactionItem: {
                  transaction: {
                    status: 'COMPLETED'
                  }
                }
              }
            }
          }
        ]
      });
    } else {
      // Active: PENDING or (PROCESSED and NOT paid)
      andConditions.push({
        OR: [
          { status: 'PENDING' },
          {
            status: 'PROCESSED',
            NOT: {
              serviceSessions: {
                some: {
                  transactionItem: {
                    transaction: {
                      status: 'COMPLETED'
                    }
                  }
                }
              }
            }
          }
        ]
      });
    }

    const bookings = await BookingListRepository.getBookings(andConditions);

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
    return await BookingListRepository.updateBookingStatus(bookingId, status);
  }
}
