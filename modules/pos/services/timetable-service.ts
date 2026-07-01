import { TimetableRepository } from "../repositories/timetable-repository";

export class TimetableService {
  static async getActiveSessions(branchId: string) {
    const sessions = await TimetableRepository.getActiveSessions(branchId);
    return sessions.map(TimetableService.mapSessionOutput);
  }

  private static mapSessionOutput(session: any) {
    const isBooking = !!session.booking;
    const itemName = isBooking
      ? (session.booking.items?.[0]?.itemNameSnapshot || "Sesi")
      : (session.transactionItem?.itemNameSnapshot || "Sesi");

    const paymentStatus = session.transactionItem?.transaction?.status
      || (isBooking ? session.booking.status : undefined);

    const customerName = session.transactionItem?.transaction?.customer?.name
      || session.booking?.customer?.name
      || session.booking?.customerName
      || "Walk-in";

    return {
      ...session,
      itemName,
      paymentStatus,
      customerName,
      transactionItem: session.transactionItem ? {
        ...session.transactionItem,
        unitPrice: session.transactionItem.unitPrice ? Number(session.transactionItem.unitPrice) : 0,
        discountAmount: session.transactionItem.discountAmount ? Number(session.transactionItem.discountAmount) : 0,
        subtotal: session.transactionItem.subtotal ? Number(session.transactionItem.subtotal) : 0,
        transaction: session.transactionItem.transaction ? {
          ...session.transactionItem.transaction,
          totalAmount: session.transactionItem.transaction.totalAmount ? Number(session.transactionItem.transaction.totalAmount) : 0,
          paidAmount: session.transactionItem.transaction.paidAmount ? Number(session.transactionItem.transaction.paidAmount) : 0,
          subtotal: session.transactionItem.transaction.subtotal ? Number(session.transactionItem.transaction.subtotal) : 0,
          discountTotal: session.transactionItem.transaction.discountTotal ? Number(session.transactionItem.transaction.discountTotal) : 0,
        } : null,
      } : null,
      booking: session.booking ? {
        ...session.booking,
        totalAmount: session.booking.totalAmount ? Number(session.booking.totalAmount) : 0,
        items: session.booking.items.map((item: any) => ({
          ...item,
          unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
          subtotal: item.subtotal ? Number(item.subtotal) : 0,
        }))
      } : null,
      customer: { name: customerName }
    };
  }

  static async getSessionsByDate(branchId: string, dateStr: string) {
    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) throw new Error("Invalid date format");

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await TimetableRepository.getSessionsByDateRange(branchId, startOfDay, endOfDay);
    return sessions.map(TimetableService.mapSessionOutput);
  }

  static async completeSession(sessionId: string) {
    const session = await TimetableRepository.getSessionByIdWithIncludes(sessionId);

    if (!session) throw new Error("Session not found");
    if (session.status !== "IN_PROGRESS") throw new Error("Session is not in progress");

    if (session.transactionItem?.transaction?.status === "PENDING" || session.booking?.status === "PENDING") {
      throw new Error("Sesi tidak dapat diselesaikan karena pembayaran belum lunas.");
    }

    return await TimetableRepository.updateSession(sessionId, { status: "COMPLETED", endTime: new Date() });
  }

  static async startSession(sessionId: string) {
    const session = await TimetableRepository.getSessionById(sessionId);

    if (!session) throw new Error("Session not found");
    if (session.status !== "SCHEDULED") throw new Error("Sesi tidak dalam status terjadwal");
    if (!session.staffId) throw new Error("Terapis belum dipilih. Silakan pilih terapis terlebih dahulu.");

    const now = new Date();
    const durationMs = session.endTime && session.startTime
      ? session.endTime.getTime() - session.startTime.getTime()
      : 60 * 60 * 1000;

    return await TimetableRepository.updateSession(sessionId, {
      status: "IN_PROGRESS",
      startTime: now,
      endTime: new Date(now.getTime() + durationMs)
    });
  }

  static async updateSessionTime(sessionId: string, startTime: Date, endTime: Date) {
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error("Waktu tidak valid");
    }

    if (endTime <= startTime) {
      throw new Error("Waktu selesai harus setelah waktu mulai");
    }

    return await TimetableRepository.updateSession(sessionId, {
      startTime,
      endTime
    });
  }

  static async updateSessionStaff(sessionId: string, staffId: string) {
    const session = await TimetableRepository.getSessionById(sessionId);

    if (!session) throw new Error("Session not found");
    if (session.status === "COMPLETED") throw new Error("Sesi sudah selesai");

    const staff = await TimetableRepository.getStaffById(staffId);
    if (!staff || !staff.isActive) throw new Error("Terapis tidak valid atau tidak aktif");

    return await TimetableRepository.updateSession(sessionId, {
      staffId
    });
  }

  static async getPendingBookings(branchId: string) {
    const bookings = await TimetableRepository.getPendingBookings(branchId);

    return bookings.map(booking => ({
      ...booking,
      totalAmount: booking.totalAmount ? Number(booking.totalAmount) : 0,
      items: booking.items.map(item => ({
        ...item,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
        subtotal: item.subtotal ? Number(item.subtotal) : 0,
      }))
    }));
  }
}
