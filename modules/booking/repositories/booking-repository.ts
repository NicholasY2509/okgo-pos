import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { BookingInput } from "../schemas/booking";
import { startOfDay, endOfDay, addMinutes, isBefore, addHours, format } from "date-fns";
import { StaffAvailabilityService } from "../../staff/services/staff-availability-service";
import { getTherapistWorkPositionFilter } from "../../staff/repositories/staff-repository";
import { PosPaymentRepository } from "../../pos/repositories/pos-payment-repository";
import {
  calculateDailyQuota,
  countRequestedBookingSlots,
  hasEnoughDailyQuota,
  type DailyBookingQuotaStatus,
} from "../services/daily-booking-quota";

const JAKARTA_TIMEZONE = "Asia/Jakarta";
const JAKARTA_UTC_OFFSET = "+07:00";

/**
 * Normalizes a `YYYY-MM-DD` or ISO date string into a `YYYY-MM-DD` calendar date in Asia/Jakarta.
 */
function toJakartaDateString(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  return new Intl.DateTimeFormat("en-CA", { timeZone: JAKARTA_TIMEZONE }).format(new Date(dateStr));
}

/**
 * Builds a Date representing a wall-clock time in Asia/Jakarta (UTC+07:00) regardless of server TZ.
 */
function parseJakartaDateTime(dateOnly: string, hours: number, minutes = 0, seconds = 0, ms = 0): Date {
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const mmm = String(ms).padStart(3, "0");
  return new Date(`${dateOnly}T${hh}:${mm}:${ss}.${mmm}${JAKARTA_UTC_OFFSET}`);
}

export const BookingRepository = {
  async getDailyQuotaStatus(
    db: Prisma.TransactionClient | typeof prisma,
    branchId: string,
    dateInput: string | Date,
    excludeBookingId?: string
  ): Promise<DailyBookingQuotaStatus> {
    const dateOnly = toJakartaDateString(
      dateInput instanceof Date ? dateInput.toISOString() : dateInput
    );
    const dayStart = parseJakartaDateTime(dateOnly, 0, 0, 0, 0);
    const dayEnd = parseJakartaDateTime(dateOnly, 23, 59, 59, 999);

    const branch = await db.branch.findUnique({
      where: { id: branchId },
      select: { maxDailyBookings: true },
    });

    const bookings = await db.booking.findMany({
      where: {
        branchId,
        status: { in: ["PENDING", "PROCESSED"] },
        scheduledStartTime: { gte: dayStart, lte: dayEnd },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
      select: {
        guestCount: true,
        items: { select: { quantity: true } },
      },
    });

    return calculateDailyQuota(branch?.maxDailyBookings ?? null, bookings);
  },

  async assertDailyQuota(
    db: Prisma.TransactionClient | typeof prisma,
    branchId: string,
    dateInput: string | Date,
    selections?: unknown[] | null,
    excludeBookingId?: string
  ): Promise<void> {
    const dailyQuota = await this.getDailyQuotaStatus(db, branchId, dateInput, excludeBookingId);
    const requestedSlots = countRequestedBookingSlots(selections);
    if (!hasEnoughDailyQuota(dailyQuota, requestedSlots)) {
      throw new Error(
        dailyQuota.remainingDailyQuota === 0
          ? `Kuota booking harian cabang sudah penuh (maksimal ${dailyQuota.maxDailyBookings} slot/hari).`
          : `Kuota booking harian cabang tidak mencukupi (tersisa ${dailyQuota.remainingDailyQuota} dari ${dailyQuota.maxDailyBookings} slot/hari).`
      );
    }
  },

  async getBranches() {
    return await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  },

  async getServices(branchId: string) {
    return await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true }, orderBy: { name: 'asc' }
    });
  },

  async getStaffStatus(branchId: string) {
    const therapistFilter = await getTherapistWorkPositionFilter();
    const staff = await prisma.staff.findMany({
      where: {
        isActive: true,
        workPosition: therapistFilter,
      },
      orderBy: { firstName: 'asc' }
    });

    const activeSessions = await prisma.serviceSession.findMany({
      where: {
        status: "IN_PROGRESS",
      }
    });

    return staff.map(s => {
      const currentSession = activeSessions.find(session => session.staffId === s.id);
      let busyUntil = null;
      if (currentSession && currentSession.endTime) {
        busyUntil = currentSession.endTime;
      } else if (currentSession && currentSession.startTime) {
        busyUntil = addMinutes(currentSession.startTime, 60);
      }

      return {
        ...s,
        isBusy: !!currentSession,
        busyUntil
      };
    });
  },

  async getDailySchedule(branchId: string, dateStr: string) {
    const targetDate = new Date(dateStr);
    const start = startOfDay(targetDate);
    const end = endOfDay(targetDate);

    const therapistFilter = await getTherapistWorkPositionFilter();
    const staff = await prisma.staff.findMany({
      where: {
        isActive: true,
        workPosition: therapistFilter,
      },
      orderBy: { firstName: 'asc' }
    });

    const rooms = await prisma.room.findMany({
      where: { branchId, isActive: true }
    });

    const sessions = await prisma.serviceSession.findMany({
      where: {
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        startTime: { gte: start, lte: end },
        OR: [
          { branchId },
          { staffId: { in: staff.map(s => s.id) } }
        ]
      },
      select: {
        id: true,
        staffId: true,
        roomId: true,
        startTime: true,
        endTime: true,
        branchId: true,
      }
    });

    const unassignedBookings = await prisma.booking.findMany({
      where: {
        branchId,
        isAssignedToTimetable: false,
        status: { in: ["PENDING"] },
        scheduledStartTime: { gte: start, lte: end }
      },
      include: { items: true }
    });

    const staffSchedules = staff.map(s => {
      const staffSessions = sessions
        .filter(session => session.staffId === s.id)
        .map(sess => ({
          startTime: sess.startTime,
          endTime: sess.endTime || addMinutes(sess.startTime!, 60),
        }));

      for (const bkg of unassignedBookings) {
        if (!bkg.scheduledStartTime) continue;
        const hasRequested = bkg.items.some(item => item.requestedStaffId === s.id);
        if (hasRequested) {
          staffSessions.push({
            startTime: bkg.scheduledStartTime,
            endTime: addMinutes(bkg.scheduledStartTime, bkg.estimatedDuration || 60),
          });
        }
      }

      return {
        ...s,
        sessions: staffSessions
      };
    });

    const totalCapacity = rooms.reduce((acc, r) => acc + (r.capacity || 1), 0);
    const roomSessions = sessions.filter(s => s.branchId === branchId && s.roomId).map(s => ({
      startTime: s.startTime,
      endTime: s.endTime || addMinutes(s.startTime!, 60)
    }));

    const simplifiedUnassigned = unassignedBookings.map(b => ({
      scheduledStartTime: b.scheduledStartTime,
      estimatedDuration: b.estimatedDuration || 60,
      guestCount: b.guestCount || b.items.length || 1,
    }));

    const dailyQuota = await this.getDailyQuotaStatus(prisma, branchId, dateStr);

    return { staffSchedules, roomSessions, totalCapacity, rooms, unassignedBookings: simplifiedUnassigned, dailyQuota };
  },

  async getAvailableSlots(branchId: string, dateStr: string, selections: { serviceId?: string, staffId?: string }[]) {
    const dateOnly = toJakartaDateString(dateStr);
    const start = parseJakartaDateTime(dateOnly, 0, 0, 0, 0);
    const end = parseJakartaDateTime(dateOnly, 23, 59, 59, 999);

    let maxDuration = 60;
    const serviceIds = selections.map(s => s.serviceId).filter(id => id) as string[];
    let services: any[] = [];
    if (serviceIds.length > 0) {
      services = await prisma.product.findMany({
        where: { id: { in: serviceIds } },
        include: { category: true }
      });
      for (const service of services) {
        if (service.duration && service.duration > maxDuration) {
          maxDuration = service.duration;
        }
      }
    }

    const rooms = await prisma.room.findMany({ where: { branchId, isActive: true } });
    const therapistFilter = await getTherapistWorkPositionFilter();
    const staff = await prisma.staff.findMany({
      where: {
        isActive: true,
        workPosition: therapistFilter,
      }
    });

    const existingSessions = await prisma.serviceSession.findMany({
      where: {
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        startTime: { gte: start, lte: end }
      }
    });

    const unassignedBookings = await prisma.booking.findMany({
      where: {
        branchId,
        isAssignedToTimetable: false,
        status: { in: ["PENDING"] },
        scheduledStartTime: { gte: start, lte: end }
      },
      include: { items: true }
    });

    const businessStart = 8;
    const businessEnd = 22;
    const closingTime = parseJakartaDateTime(dateOnly, businessEnd, 0, 0, 0);
    const slots: { time: string; availableCount: number; canFulfill: boolean; reason?: string }[] = [];
    const now = new Date();

    const dailyQuota = await this.getDailyQuotaStatus(prisma, branchId, dateOnly);
    const requestedSlots = countRequestedBookingSlots(selections);
    const quotaSatisfied = hasEnoughDailyQuota(dailyQuota, requestedSlots);

    const minTime = addHours(now, 2);

    for (let hour = businessStart; hour < businessEnd; hour++) {
      for (const minute of [0, 30]) {
        const slotStart = parseJakartaDateTime(dateOnly, hour, minute, 0, 0);
        const slotEnd = addMinutes(slotStart, maxDuration);

        if (isBefore(slotStart, minTime)) continue;

        if (slotEnd > closingTime) {
          continue;
        }

        const roomSessionCounts = new Map<string, number>();
        const busyStaffIds = StaffAvailabilityService.getBusyStaffIds(existingSessions, slotStart, slotEnd);

        for (const session of existingSessions) {
          if (!session.startTime) continue;
          const sessionStart = session.startTime;
          const sessionEnd = session.endTime || addMinutes(sessionStart, 60);

          if (session.branchId === branchId && slotStart < sessionEnd && slotEnd > sessionStart) {
            roomSessionCounts.set(session.roomId, (roomSessionCounts.get(session.roomId) || 0) + 1);
          }
        }

        let unassignedCountInSlot = 0;
        for (const bkg of unassignedBookings) {
          if (!bkg.scheduledStartTime) continue;
          const bkgStart = bkg.scheduledStartTime;
          const bkgEnd = addMinutes(bkgStart, bkg.estimatedDuration);
          if (slotStart < bkgEnd && slotEnd > bkgStart) {
            const assignedCount = existingSessions.filter(s => s.bookingId === bkg.id && s.startTime && slotStart < (s.endTime || addMinutes(s.startTime, 60)) && slotEnd > s.startTime).length;
            unassignedCountInSlot += Math.max(0, (bkg.guestCount || 1) - assignedCount);

            for (const item of bkg.items || []) {
              if (item.requestedStaffId) {
                busyStaffIds.add(item.requestedStaffId);
              }
            }
          }
        }

        const availableRooms = [];
        for (const r of rooms) {
          const count = roomSessionCounts.get(r.id) || 0;
          const capacity = r.capacity || 1;
          const remaining = Math.max(0, capacity - count);
          for (let i = 0; i < remaining; i++) {
            availableRooms.push(r);
          }
        }

        // Deduct unassigned bookings from available standard rooms (or any room)
        for (let i = 0; i < unassignedCountInSlot; i++) {
          const stdIndex = availableRooms.findIndex(r => !r.isVip);
          if (stdIndex !== -1) {
            availableRooms.splice(stdIndex, 1);
          } else if (availableRooms.length > 0) {
            availableRooms.splice(0, 1);
          }
        }

        const availableStaff = staff.filter(s => !busyStaffIds.has(s.id));
        const availableCount = Math.min(availableRooms.length, availableStaff.length);

        const vipServicesCount = services.filter(s => s.isVip).length;
        const standardServicesCount = services.length - vipServicesCount;

        const availableVipRooms = availableRooms.filter(r => r.isVip).length;
        const availableStandardRooms = availableRooms.filter(r => !r.isVip).length;

        let canFulfill = true;
        let reason: string | undefined;

        if (selections.length === 0) {
          if (availableCount < 1) {
            canFulfill = false;
            reason = "Penuh";
          }
        } else {
          if (availableRooms.length < selections.length || availableStaff.length < selections.length) {
            canFulfill = false;
            reason = availableCount === 0 ? "Penuh" : "Slot kurang";
          } else if (availableVipRooms < vipServicesCount) {
            canFulfill = false;
            reason = "VIP penuh";
          } else if (availableStandardRooms < standardServicesCount) {
            canFulfill = false;
            reason = "Kamar penuh";
          }

          if (canFulfill) {
            const requiredPositions: string[] = [];
            for (const sel of selections) {
              if (sel.serviceId) {
                const svc = services.find(s => s.id === sel.serviceId);
                if (svc?.category?.targetWorkPositionId) {
                  requiredPositions.push(svc.category.targetWorkPositionId);
                } else {
                  requiredPositions.push("ANY");
                }
              }
            }

            if (requiredPositions.length > 0) {
              const requiredCounts: Record<string, number> = {};
              requiredPositions.forEach(pos => {
                requiredCounts[pos] = (requiredCounts[pos] || 0) + 1;
              });

              for (const pos in requiredCounts) {
                if (pos !== "ANY") {
                  const availableForPos = availableStaff.filter(s => s.workPositionId === pos).length;
                  if (availableForPos < requiredCounts[pos]) {
                    canFulfill = false;
                    reason = "Terapis penuh";
                    break;
                  }
                }
              }
            }
          }

          if (canFulfill) {
            for (const sel of selections) {
              if (sel.staffId) {
                const staffIsAvailable = availableStaff.some(s => s.id === sel.staffId);
                if (!staffIsAvailable) {
                  canFulfill = false;
                  reason = "Terapis sibuk";
                  break;
                }
              }
            }
          }

          if (canFulfill) {
            const requestedSpecificStaffIds = selections.filter(s => s.staffId).map(s => s.staffId);
            const uniqueStaffIds = new Set(requestedSpecificStaffIds);
            if (uniqueStaffIds.size < requestedSpecificStaffIds.length) {
              canFulfill = false;
              reason = "Terapis ganda";
            }
          }
        }

        const effectiveAvailableCount =
          dailyQuota.remainingDailyQuota !== null
            ? Math.min(availableCount, dailyQuota.remainingDailyQuota)
            : availableCount;

        if (!quotaSatisfied) {
          canFulfill = false;
          reason =
            dailyQuota.remainingDailyQuota === 0
              ? "Kuota harian penuh"
              : "Kuota harian kurang";
        }

        slots.push({
          time: slotStart.toISOString(),
          availableCount: quotaSatisfied ? effectiveAvailableCount : 0,
          canFulfill,
          reason,
        });
      }
    }

    return slots;
  },

  async validateVoucher(code: string) {
    const voucher = await prisma.customerVoucher.findUnique({
      where: { code },
      include: {
        voucherPacket: {
          include: { product: true }
        }
      }
    });

    if (!voucher) {
      throw new Error("Voucher tidak ditemukan");
    }

    if (voucher.status !== "ACTIVE") {
      throw new Error(`Voucher sudah tidak aktif (Status: ${voucher.status})`);
    }

    if (voucher.expiresAt && voucher.expiresAt < new Date()) {
      throw new Error("Voucher sudah kedaluwarsa");
    }

    if (voucher.remainingCreditAmount !== null && Number(voucher.remainingCreditAmount) <= 0) {
      throw new Error("Saldo voucher sudah habis");
    }

    if (voucher.remainingVisitCount !== null && voucher.remainingVisitCount <= 0) {
      throw new Error("Batas pemakaian voucher sudah habis");
    }

    return voucher;
  },

  async createBooking(data: BookingInput) {
    return await prisma.$transaction(async (tx) => {
      await this.assertDailyQuota(tx, data.branchId, new Date(data.startTime), data.selections);

      let customer;
      if (data.customerId) {
        customer = await tx.customer.findUnique({
          where: { id: data.customerId }
        });
        if (!customer) throw new Error("Pelanggan tidak ditemukan.");
      } else if (data.customerName && data.customerPhone) {
        customer = await tx.customer.findFirst({
          where: { phone: data.customerPhone }
        });
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              name: data.customerName,
              phone: data.customerPhone,
            }
          });
        }
      } else {
        throw new Error("Pelanggan wajib diisi.");
      }

      const serviceIds = (data.selections?.map(s => s.serviceId).filter(id => id) as string[]) || [];
      let services: any[] = [];
      let maxDuration = 60;

      if (serviceIds.length > 0) {
        services = await tx.product.findMany({
          where: { id: { in: serviceIds } }
        });

        for (const s of services) {
          if (s.duration && s.duration > maxDuration) maxDuration = s.duration;
        }
      }

      const slotStart = new Date(data.startTime);
      const slotEnd = addMinutes(slotStart, maxDuration);

      const therapistFilter = await getTherapistWorkPositionFilter();
      const rooms = await tx.room.findMany({ where: { branchId: data.branchId, isActive: true } });
      const staffList = await tx.staff.findMany({
        where: {
          isActive: true,
          workPosition: therapistFilter,
        }
      });

      const existingSessions = await tx.serviceSession.findMany({
        where: {
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          startTime: {
            gte: startOfDay(slotStart),
            lte: endOfDay(slotStart)
          }
        }
      });

      const roomSessionCounts = new Map<string, number>();
      const busyStaffIds = StaffAvailabilityService.getBusyStaffIds(existingSessions, slotStart, slotEnd);

      for (const session of existingSessions) {
        if (!session.startTime) continue;
        const sessionStart = session.startTime;
        const sessionEnd = session.endTime || addMinutes(sessionStart, 60);

        if (session.branchId === data.branchId && slotStart < sessionEnd && slotEnd > sessionStart) {
          roomSessionCounts.set(session.roomId, (roomSessionCounts.get(session.roomId) || 0) + 1);
        }
      }

      const unassignedBookings = await tx.booking.findMany({
        where: {
          branchId: data.branchId,
          isAssignedToTimetable: false,
          status: { in: ["PENDING"] },
          scheduledStartTime: {
            gte: startOfDay(slotStart),
            lte: endOfDay(slotStart)
          }
        },
        include: { items: true }
      });
      let unassignedCountInSlot = 0;
      for (const bkg of unassignedBookings) {
        if (!bkg.scheduledStartTime) continue;
        const bkgStart = bkg.scheduledStartTime;
        const bkgEnd = addMinutes(bkgStart, bkg.estimatedDuration);
        if (slotStart < bkgEnd && slotEnd > bkgStart) {
          const assignedCount = existingSessions.filter(s => s.bookingId === bkg.id && s.startTime && slotStart < (s.endTime || addMinutes(s.startTime, 60)) && slotEnd > s.startTime).length;
          unassignedCountInSlot += Math.max(0, (bkg.guestCount || 1) - assignedCount);

          for (const item of bkg.items || []) {
            if (item.requestedStaffId) {
              busyStaffIds.add(item.requestedStaffId);
            }
          }
        }
      }

      const availableRooms = [];
      for (const r of rooms) {
        const count = roomSessionCounts.get(r.id) || 0;
        const capacity = r.capacity || 1;
        const remaining = Math.max(0, capacity - count);
        for (let i = 0; i < remaining; i++) {
          availableRooms.push(r);
        }
      }

      for (let i = 0; i < unassignedCountInSlot; i++) {
        const stdIndex = availableRooms.findIndex(r => !r.isVip);
        if (stdIndex !== -1) {
          availableRooms.splice(stdIndex, 1);
        } else if (availableRooms.length > 0) {
          availableRooms.splice(0, 1);
        }
      }

      const availableStaff = staffList.filter(s => !busyStaffIds.has(s.id));

      const vipServicesCount = services.filter(s => s.isVip).length;
      const standardServicesCount = services.length - vipServicesCount;

      const availableVipRooms = availableRooms.filter(r => r.isVip).length;
      const availableStandardRooms = availableRooms.filter(r => !r.isVip).length;

      const activeSelections = (data.selections || []).filter(s => s.serviceId);
      const hasAssignedServices = activeSelections.length > 0;

      if (availableRooms.length < (data.selections || []).length) {
        throw new Error("Kapasitas ruangan tidak mencukupi untuk waktu ini.");
      }

      if (hasAssignedServices) {
        if (availableVipRooms < vipServicesCount || availableStandardRooms < standardServicesCount || availableStaff.length < activeSelections.length) {
          throw new Error("Kapasitas ruangan/terapis tidak mencukupi untuk waktu ini.");
        }

        const requiredPositions: string[] = [];
        for (const sel of activeSelections) {
          const svc = services.find(s => s.id === sel.serviceId);
          if (svc?.category?.targetWorkPositionId) {
            requiredPositions.push(svc.category.targetWorkPositionId);
          } else {
            requiredPositions.push("ANY");
          }
        }

        if (requiredPositions.length > 0) {
          const requiredCounts: Record<string, number> = {};
          requiredPositions.forEach(pos => {
            requiredCounts[pos] = (requiredCounts[pos] || 0) + 1;
          });

          for (const pos in requiredCounts) {
            if (pos !== "ANY") {
              const availableForPos = availableStaff.filter(s => s.workPositionId === pos).length;
              if (availableForPos < requiredCounts[pos]) {
                throw new Error("Kapasitas terapis dengan role yang dibutuhkan tidak mencukupi untuk waktu ini.");
              }
            }
          }
        }
      }

      let subtotal = 0;
      const transactionItems = [];

      for (const sel of (data.selections || [])) {
        if (!sel.serviceId) continue;
        const service = services.find(s => s.id === sel.serviceId);
        if (!service) throw new Error("Service not found");

        let assignedRoomIndex = availableRooms.findIndex(r => r.isVip === service.isVip);
        if (assignedRoomIndex === -1) {
          throw new Error(`Tidak ada ruangan ${service.isVip ? 'VIP' : 'Standar'} yang tersedia.`);
        }
        let assignedRoom = availableRooms.splice(assignedRoomIndex, 1)[0];
        let assignedStaff;

        const targetWorkPositionId = service.category?.targetWorkPositionId;

        if (sel.staffId) {
          const staffIndex = availableStaff.findIndex(s => s.id === sel.staffId && (!targetWorkPositionId || s.workPositionId === targetWorkPositionId));
          if (staffIndex === -1) {
            throw new Error("Terapis yang dipilih tidak tersedia atau tidak memiliki role yang sesuai.");
          }
          assignedStaff = availableStaff[staffIndex];
          availableStaff.splice(staffIndex, 1);
        } else {
          assignedStaff = null;
          // Note: we've already validated capacity above, so we know there's enough staff
          // and we let the timetable automatically assign the appropriate staff later.
          // BUT we must "reserve" an available staff member from availableStaff to prevent 
          // overbooking the same role. We will remove the first one that matches.
          const anyStaffIndex = availableStaff.findIndex(s => !targetWorkPositionId || s.workPositionId === targetWorkPositionId);
          if (anyStaffIndex !== -1) {
            availableStaff.splice(anyStaffIndex, 1); // reserve capacity
          }
        }

        if (!assignedRoom) {
          throw new Error("Gagal mengalokasikan ruangan.");
        }

        let itemSubtotal = Number(service.price);
        if (sel.appliedVoucherId) {
          itemSubtotal = 0;
        }
        subtotal += itemSubtotal;

        transactionItems.push({
          type: "SERVICE",
          serviceId: service.id,
          itemNameSnapshot: service.name,
          unitPrice: service.price,
          subtotal: itemSubtotal,
          quantity: 1,
          _assignedRoomId: assignedRoom.id,
          _assignedStaffId: assignedStaff?.id || null,
          _duration: service.duration || 60,
          _appliedVoucherId: sel.appliedVoucherId || null
        });
      }

      const bookingNumber = `BKG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      let finalTotalAmount = subtotal;
      if (data.appliedVoucherId) {
        const voucher = await tx.customerVoucher.findUnique({ where: { id: data.appliedVoucherId } });
        if (voucher && voucher.remainingCreditAmount) {
          const discount = Math.min(subtotal, Number(voucher.remainingCreditAmount));
          finalTotalAmount = Math.max(0, subtotal - discount);
        }
      }

      const booking = await tx.booking.create({
        data: {
          branchId: data.branchId,
          customer: { connect: { id: customer.id } },
          bookingNumber,
          customerName: customer.name,
          customerPhone: customer.phone,
          totalAmount: finalTotalAmount,
          status: "PENDING",
          scheduledStartTime: slotStart,
          estimatedDuration: maxDuration,
          guestCount: (data.selections || []).length > 0 ? data.selections!.length : 1,
          ...(data.appliedVoucherId ? { appliedVoucher: { connect: { id: data.appliedVoucherId } } } : {}),
          isAssignedToTimetable: false,
          items: transactionItems.length > 0 ? {
            create: transactionItems.map(item => ({
              serviceId: item.serviceId,
              itemNameSnapshot: item.itemNameSnapshot,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              quantity: item.quantity,
              requestedStaffId: item._assignedStaffId || undefined,
              ...(item._appliedVoucherId ? { appliedVoucher: { connect: { id: item._appliedVoucherId } } } : {})
            }))
          } : undefined
        },
        include: { items: { include: { appliedVoucher: { include: { voucherPacket: { include: { product: true } } } } } } }
      });

      return { booking, serviceSessions: [] };
    });
  },

  async updateBooking(bookingId: string, data: BookingInput) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!existing || existing.status !== "PENDING") throw new Error("Hanya booking dengan status PENDING yang dapat diubah.");

      await this.assertDailyQuota(tx, data.branchId, new Date(data.startTime), data.selections, bookingId);

      let customer;
      if (data.customerId) {
        customer = await tx.customer.findUnique({
          where: { id: data.customerId }
        });
        if (!customer) throw new Error("Pelanggan tidak ditemukan.");
      } else if (data.customerName && data.customerPhone) {
        customer = await tx.customer.findFirst({
          where: { phone: data.customerPhone }
        });
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              name: data.customerName,
              phone: data.customerPhone,
            }
          });
        }
      } else {
        throw new Error("Pelanggan wajib diisi.");
      }

      const serviceIds = (data.selections?.map(s => s.serviceId).filter(id => id) as string[]) || [];
      let services: any[] = [];
      let maxDuration = 60;

      if (serviceIds.length > 0) {
        services = await tx.product.findMany({
          where: { id: { in: serviceIds } }
        });

        for (const s of services) {
          if (s.duration && s.duration > maxDuration) maxDuration = s.duration;
        }
      }

      const slotStart = new Date(data.startTime);
      const slotEnd = addMinutes(slotStart, maxDuration);

      const therapistFilter = await getTherapistWorkPositionFilter();
      const rooms = await tx.room.findMany({ where: { branchId: data.branchId, isActive: true } });
      const staffList = await tx.staff.findMany({
        where: {
          isActive: true,
          workPosition: therapistFilter,
        }
      });

      const existingSessions = await tx.serviceSession.findMany({
        where: {
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          startTime: {
            gte: startOfDay(slotStart),
            lte: endOfDay(slotStart)
          }
        }
      });

      const roomSessionCounts = new Map<string, number>();
      const busyStaffIds = StaffAvailabilityService.getBusyStaffIds(existingSessions, slotStart, slotEnd);

      for (const session of existingSessions) {
        if (!session.startTime) continue;
        const sessionStart = session.startTime;
        const sessionEnd = session.endTime || addMinutes(sessionStart, 60);

        if (session.branchId === data.branchId && slotStart < sessionEnd && slotEnd > sessionStart) {
          roomSessionCounts.set(session.roomId, (roomSessionCounts.get(session.roomId) || 0) + 1);
        }
      }

      const unassignedBookings = await tx.booking.findMany({
        where: {
          branchId: data.branchId,
          isAssignedToTimetable: false,
          status: { in: ["PENDING"] },
          id: { not: bookingId },
          scheduledStartTime: {
            gte: startOfDay(slotStart),
            lte: endOfDay(slotStart)
          }
        },
        include: { items: true }
      });
      let unassignedCountInSlot = 0;
      for (const bkg of unassignedBookings) {
        if (!bkg.scheduledStartTime) continue;
        const bkgStart = bkg.scheduledStartTime;
        const bkgEnd = addMinutes(bkgStart, bkg.estimatedDuration);
        if (slotStart < bkgEnd && slotEnd > bkgStart) {
          const assignedCount = existingSessions.filter(s => s.bookingId === bkg.id && s.startTime && slotStart < (s.endTime || addMinutes(s.startTime, 60)) && slotEnd > s.startTime).length;
          unassignedCountInSlot += Math.max(0, (bkg.guestCount || 1) - assignedCount);

          for (const item of bkg.items || []) {
            if (item.requestedStaffId) {
              busyStaffIds.add(item.requestedStaffId);
            }
          }
        }
      }

      const availableRooms = [];
      for (const r of rooms) {
        const count = roomSessionCounts.get(r.id) || 0;
        const capacity = r.capacity || 1;
        const remaining = Math.max(0, capacity - count);
        for (let i = 0; i < remaining; i++) {
          availableRooms.push(r);
        }
      }

      for (let i = 0; i < unassignedCountInSlot; i++) {
        const stdIndex = availableRooms.findIndex(r => !r.isVip);
        if (stdIndex !== -1) {
          availableRooms.splice(stdIndex, 1);
        } else if (availableRooms.length > 0) {
          availableRooms.splice(0, 1);
        }
      }

      const availableStaff = staffList.filter(s => !busyStaffIds.has(s.id));

      const vipServicesCount = services.filter(s => s.isVip).length;
      const standardServicesCount = services.length - vipServicesCount;

      const availableVipRooms = availableRooms.filter(r => r.isVip).length;
      const availableStandardRooms = availableRooms.filter(r => !r.isVip).length;

      const activeSelections = (data.selections || []).filter(s => s.serviceId);
      const hasAssignedServices = activeSelections.length > 0;

      if (availableRooms.length < (data.selections || []).length) {
        throw new Error("Kapasitas ruangan tidak mencukupi untuk waktu ini.");
      }

      if (hasAssignedServices) {
        if (availableVipRooms < vipServicesCount || availableStandardRooms < standardServicesCount || availableStaff.length < activeSelections.length) {
          throw new Error("Kapasitas ruangan/terapis tidak mencukupi untuk waktu ini.");
        }
      }

      let subtotal = 0;
      const transactionItems = [];

      for (const sel of (data.selections || [])) {
        if (!sel.serviceId) continue;
        const service = services.find(s => s.id === sel.serviceId);
        if (!service) throw new Error("Service not found");

        let assignedRoomIndex = availableRooms.findIndex(r => r.isVip === service.isVip);
        if (assignedRoomIndex === -1) {
          throw new Error(`Tidak ada ruangan ${service.isVip ? 'VIP' : 'Standar'} yang tersedia.`);
        }
        let assignedRoom = availableRooms.splice(assignedRoomIndex, 1)[0];
        let assignedStaff;

        if (sel.staffId) {
          const staffIndex = availableStaff.findIndex(s => s.id === sel.staffId);
          if (staffIndex === -1) {
            throw new Error("Terapis yang dipilih tidak tersedia di waktu ini.");
          }
          assignedStaff = availableStaff[staffIndex];
          availableStaff.splice(staffIndex, 1);
        } else {
          assignedStaff = null;
        }

        if (!assignedRoom) {
          throw new Error("Gagal mengalokasikan ruangan.");
        }

        subtotal += Number(service.price);

        transactionItems.push({
          type: "SERVICE",
          serviceId: service.id,
          itemNameSnapshot: service.name,
          unitPrice: service.price,
          subtotal: service.price,
          quantity: 1,
          _assignedRoomId: assignedRoom.id,
          _assignedStaffId: assignedStaff?.id || null,
          _duration: service.duration || 60
        });
      }

      const bookingNumber = `BKG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      let finalTotalAmount = subtotal;

      if (data.appliedVoucherId) {
        const voucher = await tx.customerVoucher.findUnique({ where: { id: data.appliedVoucherId } });
        if (voucher && voucher.remainingCreditAmount) {
          const discount = Math.min(subtotal, Number(voucher.remainingCreditAmount));
          finalTotalAmount = Math.max(0, subtotal - discount);
        }
      }

      await tx.bookingItem.deleteMany({ where: { bookingId } });
      await tx.serviceSession.deleteMany({ where: { bookingId } });

      const booking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          customer: { connect: { id: customer.id } },
          branchId: data.branchId,
          guestCount: (data.selections || []).length,
          totalAmount: finalTotalAmount,
          estimatedDuration: maxDuration,
          scheduledStartTime: slotStart,
          ...(data.appliedVoucherId ? { appliedVoucher: { connect: { id: data.appliedVoucherId } } } : { appliedVoucher: { disconnect: true } }),
          isAssignedToTimetable: false,
          items: {
            create: transactionItems.map((item: any) => ({
              serviceId: item.serviceId,
              itemNameSnapshot: item.itemNameSnapshot,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              quantity: item.quantity,
              requestedStaffId: item._assignedStaffId || undefined,
              ...(item._appliedVoucherId ? { appliedVoucher: { connect: { id: item._appliedVoucherId } } } : {})
            }))
          }
        }
      });

      return { booking, serviceSessions: [] };
    });
  },

  async prepareBookingAssignment(
    tx: Prisma.TransactionClient,
    bookingId: string,
    startTime: Date,
    selections: { serviceId: string; staffId?: string; roomId?: string; isVip?: boolean; discountAmount?: number; customerVoucherId?: string }[],
    promotionIds?: string[],
    nominalVoucherId?: string
  ) {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          items: { include: { appliedVoucher: { include: { voucherPacket: { include: { product: true } } } } } },
          serviceSessions: true
        }
      });

      if (!booking) throw new Error("Booking tidak ditemukan");
      if (booking.isAssignedToTimetable) throw new Error("Booking sudah ditugaskan ke jadwal");

      const slotStart = startTime;

      const services = await tx.product.findMany({
        where: { id: { in: selections.map(s => s.serviceId) } }
      });

      let maxDuration = 0;
      services.forEach((s: any) => {
        if (s.duration > maxDuration) maxDuration = s.duration;
      });

      const slotEnd = addMinutes(slotStart, maxDuration);

      const therapistFilter = await getTherapistWorkPositionFilter();
      const rooms = await tx.room.findMany({
        where: { branchId: booking.branchId, isActive: true }
      });

      const staffList = await tx.staff.findMany({
        where: {
          isActive: true,
          workPosition: therapistFilter,
        }
      });

      const existingSessions = await tx.serviceSession.findMany({
        where: {
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          startTime: {
            gte: startOfDay(slotStart),
            lte: endOfDay(slotStart)
          }
        }
      });

      const roomSessionCounts = new Map<string, number>();
      const busyStaffIds = StaffAvailabilityService.getBusyStaffIds(existingSessions, slotStart, slotEnd);

      for (const session of existingSessions) {
        if (!session.startTime) continue;
        const sessionStart = session.startTime;
        const sessionEnd = session.endTime || addMinutes(sessionStart, 60);

        if (session.branchId === booking.branchId && slotStart < sessionEnd && slotEnd > sessionStart) {
          roomSessionCounts.set(session.roomId, (roomSessionCounts.get(session.roomId) || 0) + 1);
        }
      }

      // Note: Since THIS booking is the one being assigned, its unassigned count (guestCount)
      // shouldn't block its OWN assignment! We ignore its own unassigned guests by filtering it out,
      // or we just calculate unassigned bookings excluding this one.
      const unassignedBookings = await tx.booking.findMany({
        where: {
          branchId: booking.branchId,
          isAssignedToTimetable: false,
          status: { in: ["PENDING"] },
          id: { not: booking.id }, // Ignore THIS booking
          scheduledStartTime: {
            gte: startOfDay(slotStart),
            lte: endOfDay(slotStart)
          }
        },
        include: { items: true }
      });
      let unassignedCountInSlot = 0;
      for (const bkg of unassignedBookings) {
        if (!bkg.scheduledStartTime) continue;
        const bkgStart = bkg.scheduledStartTime;
        const bkgEnd = addMinutes(bkgStart, bkg.estimatedDuration);
        if (slotStart < bkgEnd && slotEnd > bkgStart) {
          const assignedCount = existingSessions.filter(s => s.bookingId === bkg.id && s.startTime && slotStart < (s.endTime || addMinutes(s.startTime, 60)) && slotEnd > s.startTime).length;
          unassignedCountInSlot += Math.max(0, (bkg.guestCount || 1) - assignedCount);

          for (const item of bkg.items || []) {
            if (item.requestedStaffId) {
              busyStaffIds.add(item.requestedStaffId);
            }
          }
        }
      }

      const availableRooms = [];
      for (const r of rooms) {
        const count = roomSessionCounts.get(r.id) || 0;
        const capacity = r.capacity || 1;
        const remaining = Math.max(0, capacity - count);
        for (let i = 0; i < remaining; i++) {
          availableRooms.push(r);
        }
      }

      for (let i = 0; i < unassignedCountInSlot; i++) {
        const stdIndex = availableRooms.findIndex(r => !r.isVip);
        if (stdIndex !== -1) {
          availableRooms.splice(stdIndex, 1);
        } else if (availableRooms.length > 0) {
          availableRooms.splice(0, 1);
        }
      }

      const availableStaff = staffList.filter(s => !busyStaffIds.has(s.id));

      const activeSelections = selections.filter(s => s.serviceId);
      if (activeSelections.length === 0) {
        throw new Error("Pilih setidaknya satu layanan.");
      }

      let vipServicesCount = 0;
      let standardServicesCount = 0;
      for (const sel of activeSelections) {
        const svc = services.find((s: any) => s.id === sel.serviceId);
        if (sel.isVip || svc?.isVip) {
          vipServicesCount += 1;
        } else {
          standardServicesCount += 1;
        }
      }

      const availableVipRooms = availableRooms.filter(r => r.isVip).length;
      const availableStandardRooms = availableRooms.filter(r => !r.isVip).length;

      if (availableRooms.length < selections.length) {
        throw new Error("Kapasitas ruangan tidak mencukupi untuk waktu ini.");
      }

      if (availableVipRooms < vipServicesCount || availableStandardRooms < standardServicesCount || availableStaff.length < activeSelections.length) {
        throw new Error("Kapasitas ruangan/terapis tidak mencukupi untuk waktu ini.");
      }

      let subtotal = 0;
      let discountTotal = 0;
      let vipUpgradeCount = 0;
      const transactionItems = [];

      for (const sel of selections) {
        if (!sel.serviceId) continue;
        const service = services.find((s: any) => s.id === sel.serviceId);
        if (!service) throw new Error("Service not found");

        const isItemVip = Boolean(sel.isVip || service.isVip);

        let assignedRoomIndex = -1;
        if (sel.roomId) {
          assignedRoomIndex = availableRooms.findIndex(r => r.id === sel.roomId);
          if (assignedRoomIndex === -1) {
            throw new Error("Ruangan yang dipilih tidak tersedia atau kapasitas penuh di waktu ini.");
          }
          const chosenRoom = availableRooms[assignedRoomIndex];
          if (isItemVip && !chosenRoom.isVip) {
            throw new Error(`Ruangan "${chosenRoom.name}" bukan ruangan VIP.`);
          }
          if (!isItemVip && chosenRoom.isVip) {
            throw new Error(`Ruangan "${chosenRoom.name}" adalah ruangan VIP. Centang "Upgrade ke VIP" terlebih dahulu.`);
          }
        } else {
          assignedRoomIndex = availableRooms.findIndex(r => Boolean(r.isVip) === isItemVip);
          if (assignedRoomIndex === -1) {
            throw new Error(`Tidak ada ruangan ${isItemVip ? 'VIP' : 'Standar'} yang tersedia.`);
          }
        }
        let assignedRoom = availableRooms.splice(assignedRoomIndex, 1)[0];
        let assignedStaff;

        if (sel.staffId) {
          const staffIndex = availableStaff.findIndex((s: any) => s.id === sel.staffId);
          if (staffIndex === -1) {
            throw new Error("Terapis yang dipilih tidak tersedia di waktu ini.");
          }
          assignedStaff = availableStaff[staffIndex];
          availableStaff.splice(staffIndex, 1);
        } else {
          assignedStaff = null;
        }

        if (!assignedRoom) {
          throw new Error("Gagal mengalokasikan ruangan.");
        }

        const unitPrice = Number(service.price);
        const itemDiscount = sel.customerVoucherId
          ? unitPrice
          : Math.min(unitPrice, Math.max(0, Number(sel.discountAmount || 0)));
        const itemSubtotal = Math.max(0, unitPrice - itemDiscount);

        subtotal += unitPrice;
        discountTotal += itemDiscount;
        if (sel.isVip) {
          vipUpgradeCount += 1;
        }

        transactionItems.push({
          type: "SERVICE",
          serviceId: service.id,
          itemNameSnapshot: service.name,
          unitPrice,
          discountAmount: itemDiscount,
          subtotal: itemSubtotal,
          quantity: 1,
          _assignedRoomId: assignedRoom.id,
          _assignedStaffId: assignedStaff?.id || null,
          _duration: service.duration || 60,
          _isVip: isItemVip,
          _customerVoucherId: sel.customerVoucherId || null,
        });
      }

      if (vipUpgradeCount > 0) {
        const vipTotal = vipUpgradeCount * 80000;
        subtotal += vipTotal;
      }

      const hasVoucherApplied =
        transactionItems.some((item) => Boolean(item._customerVoucherId)) || Boolean(nominalVoucherId);
      if (hasVoucherApplied && promotionIds && promotionIds.length > 0) {
        throw new Error("Voucher dan Diskon Promosi tidak dapat digunakan bersamaan.");
      }

      const appliedPromotionIds: string[] = [];
      if (promotionIds && promotionIds.length > 0) {
        const promos = await tx.promotion.findMany({
          where: { id: { in: promotionIds }, isActive: true },
          include: { applicableProducts: true },
        });

        for (const promo of promos) {
          appliedPromotionIds.push(promo.id);
          const reward = promo.reward as any;
          if (reward?.type === "PERCENTAGE_TOTAL" && reward.value) {
            for (const itemData of transactionItems) {
              const discount = itemData.unitPrice * (reward.value / 100);
              itemData.discountAmount += discount;
              discountTotal += discount;
              itemData.subtotal = Math.max(0, itemData.unitPrice - itemData.discountAmount);
            }
          } else if (reward?.type === "PERCENTAGE_ITEM" && reward.value) {
            const applicableIds = promo.applicableProducts?.map((p: any) => p.id) || [];
            if (applicableIds.length > 0) {
              for (const itemData of transactionItems) {
                if (applicableIds.includes(itemData.serviceId)) {
                  const discount = itemData.unitPrice * (reward.value / 100);
                  itemData.discountAmount += discount;
                  discountTotal += discount;
                  itemData.subtotal = Math.max(0, itemData.unitPrice - itemData.discountAmount);
                }
              }
            }
          } else if (reward?.type === "FREE_ADDON" && reward.addonServiceId) {
            const product = await tx.product.findUnique({ where: { id: reward.addonServiceId } });
            if (product) discountTotal += Number(product.price);
          }
        }
      }

      let nominalVoucher: any = null;
      let nominalVoucherDiscount = 0;
      if (nominalVoucherId) {
        const voucher = await tx.customerVoucher.findUnique({
          where: { id: nominalVoucherId },
          include: { voucherPacket: true },
        });
        if (!voucher) throw new Error("Voucher nominal tidak ditemukan.");
        if (voucher.customerId && booking.customerId && voucher.customerId !== booking.customerId) {
          throw new Error("Voucher bukan milik pelanggan ini.");
        }
        if (voucher.status !== "ACTIVE") {
          throw new Error(`Status voucher adalah ${voucher.status}.`);
        }
        if (voucher.expiresAt && voucher.expiresAt < new Date()) {
          throw new Error("Voucher telah kedaluwarsa.");
        }
        if (voucher.remainingCreditAmount == null || Number(voucher.remainingCreditAmount) <= 0) {
          throw new Error("Saldo voucher nominal sudah habis.");
        }

        const remainingBeforeVoucher = Math.max(0, subtotal - discountTotal);
        nominalVoucherDiscount = Math.min(Number(voucher.remainingCreditAmount), remainingBeforeVoucher);
        discountTotal += nominalVoucherDiscount;
        nominalVoucher = voucher;
      }

      const totalAmount = Math.max(0, subtotal - discountTotal);

      return {
        booking,
        slotStart,
        maxDuration,
        subtotal,
        discountTotal,
        totalAmount,
        vipUpgradeCount,
        appliedPromotionIds,
        nominalVoucher,
        nominalVoucherDiscount,
        transactionItems,
      };
  },

  async previewBookingAssignment(
    bookingId: string,
    startTime: Date,
    selections: { serviceId: string; staffId?: string; roomId?: string; isVip?: boolean; discountAmount?: number; customerVoucherId?: string }[],
    promotionIds?: string[],
    nominalVoucherId?: string
  ) {
    const prepared = await this.prepareBookingAssignment(prisma, bookingId, startTime, selections, promotionIds, nominalVoucherId);
    const items = prepared.transactionItems.map((item, idx) => ({
      id: `preview-${idx}`,
      type: item.type,
      serviceId: item.serviceId,
      itemNameSnapshot: item.itemNameSnapshot,
      unitPrice: Number(item.unitPrice),
      discountAmount: Number(item.discountAmount),
      quantity: item.quantity,
      subtotal: Number(item.subtotal),
    }));

    if (prepared.vipUpgradeCount > 0) {
      items.push({
        id: "preview-vip-upgrade",
        type: "VIP_UPGRADE",
        serviceId: "VIP_UPGRADE",
        itemNameSnapshot:
          prepared.vipUpgradeCount > 1
            ? `Upgrade VIP (${prepared.vipUpgradeCount} Sesi)`
            : "Upgrade VIP",
        unitPrice: 80000,
        discountAmount: 0,
        quantity: prepared.vipUpgradeCount,
        subtotal: prepared.vipUpgradeCount * 80000,
      });
    }

    return {
      isPendingBookingAssignment: true,
      pendingAssignment: {
        bookingId,
        startTime: startTime.toISOString(),
        selections,
        promotionIds: prepared.appliedPromotionIds,
        nominalVoucherId: prepared.nominalVoucher?.id,
      },
      customerId: prepared.booking.customerId,
      customer: prepared.booking.customer,
      subtotal: prepared.subtotal,
      discountTotal: prepared.discountTotal,
      totalAmount: prepared.totalAmount,
      paidAmount: 0,
      items,
    };
  },

  async assignBookingInTx(
    tx: Prisma.TransactionClient,
    bookingId: string,
    startTime: Date,
    selections: { serviceId: string; staffId?: string; roomId?: string; isVip?: boolean; discountAmount?: number; customerVoucherId?: string }[],
    promotionIds?: string[],
    nominalVoucherId?: string
  ) {
      const {
        booking,
        slotStart,
        maxDuration,
        subtotal,
        discountTotal,
        totalAmount,
        vipUpgradeCount,
        appliedPromotionIds,
        nominalVoucher,
        nominalVoucherDiscount,
        transactionItems,
      } = await this.prepareBookingAssignment(tx, bookingId, startTime, selections, promotionIds, nominalVoucherId);

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          isAssignedToTimetable: true,
          status: "PROCESSED",
          totalAmount: totalAmount,
          estimatedDuration: maxDuration,
          scheduledStartTime: startTime,
          guestCount: selections.length,
          items: {
            create: transactionItems.map(item => ({
              serviceId: item.serviceId,
              itemNameSnapshot: item.itemNameSnapshot,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              quantity: item.quantity
            }))
          }
        }
      });

      const today = new Date();
      const dateStrTx = today.toISOString().slice(0, 10).replace(/-/g, '');
      const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
      const transactionNumber = `TX-${dateStrTx}-${randomStr}`;

      const transaction = await tx.transaction.create({
        data: {
          branchId: booking.branchId,
          customerId: booking.customerId,
          transactionNumber,
          subtotal: subtotal,
          discountTotal: discountTotal,
          totalAmount: totalAmount,
          status: 'PENDING',
          isVip: vipUpgradeCount > 0 || transactionItems.some((i) => i._isVip),
          ...(appliedPromotionIds.length > 0
            ? {
                promotions: {
                  connect: appliedPromotionIds.map((id) => ({ id })),
                },
              }
            : {}),
        }
      });

      const createdSessions = [];
      for (let i = 0; i < transactionItems.length; i++) {
        const itemSpec = transactionItems[i];
        const sessionSlotEnd = addMinutes(slotStart, itemSpec._duration);

        const txItem = await tx.transactionItem.create({
          data: {
            transactionId: transaction.id,
            type: 'SERVICE',
            serviceId: itemSpec.serviceId,
            itemNameSnapshot: itemSpec.itemNameSnapshot,
            unitPrice: itemSpec.unitPrice,
            discountAmount: itemSpec.discountAmount,
            quantity: itemSpec.quantity,
            subtotal: itemSpec.subtotal,
          }
        });

        const session = await tx.serviceSession.create({
          data: {
            bookingId: booking.id,
            customerId: booking.customerId,
            serviceId: itemSpec.serviceId,
            staffId: itemSpec._assignedStaffId || undefined,
            roomId: itemSpec._assignedRoomId,
            branchId: booking.branchId,
            status: "SCHEDULED",
            isVip: itemSpec._isVip,
            startTime: slotStart,
            endTime: sessionSlotEnd,
            transactionItemId: txItem.id,
          }
        });
        createdSessions.push(session);

        if (itemSpec._customerVoucherId) {
          const customerVoucher = await tx.customerVoucher.findUnique({
            where: { id: itemSpec._customerVoucherId },
          });
          if (!customerVoucher) {
            throw new Error("Voucher layanan tidak ditemukan.");
          }
          if (customerVoucher.customerId && booking.customerId && customerVoucher.customerId !== booking.customerId) {
            throw new Error("Voucher bukan milik pelanggan ini.");
          }
          if (customerVoucher.status !== "ACTIVE") {
            throw new Error(`Status voucher adalah ${customerVoucher.status}.`);
          }
          if (customerVoucher.expiresAt && customerVoucher.expiresAt < new Date()) {
            throw new Error("Voucher telah kedaluwarsa.");
          }
          if (customerVoucher.remainingVisitCount == null || customerVoucher.remainingVisitCount <= 0) {
            throw new Error("Kuota kunjungan voucher telah habis.");
          }

          await tx.customerVoucher.update({
            where: { id: customerVoucher.id },
            data: {
              remainingVisitCount: customerVoucher.remainingVisitCount - 1,
              status: customerVoucher.remainingVisitCount - 1 === 0 ? "USED_UP" : "ACTIVE",
            },
          });

          await tx.voucherRedemption.create({
            data: {
              customerVoucherId: customerVoucher.id,
              transactionId: transaction.id,
              transactionItemId: txItem.id,
              serviceSessionId: session.id,
              redeemedVisitCount: 1,
            },
          });
        }
      }

      if (nominalVoucher && nominalVoucherDiscount > 0) {
        await tx.customerVoucher.update({
          where: { id: nominalVoucher.id },
          data: {
            remainingCreditAmount: 0,
            status: "USED_UP",
          },
        });

        await tx.voucherRedemption.create({
          data: {
            customerVoucherId: nominalVoucher.id,
            transactionId: transaction.id,
            redeemedAmount: nominalVoucherDiscount,
          },
        });
      }

      if (vipUpgradeCount > 0) {
        await tx.transactionItem.create({
          data: {
            transactionId: transaction.id,
            type: "VIP_UPGRADE",
            serviceId: "VIP_UPGRADE",
            itemNameSnapshot:
              vipUpgradeCount > 1 ? `Upgrade VIP (${vipUpgradeCount} Sesi)` : "Upgrade VIP",
            unitPrice: 80000,
            quantity: vipUpgradeCount,
            subtotal: vipUpgradeCount * 80000,
          },
        });
      }

      const fullTransaction = await tx.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          items: true,
          customer: {
            select: { id: true, name: true, phone: true }
          }
        }
      });

      return fullTransaction
        ? {
            ...fullTransaction,
            subtotal: Number(fullTransaction.subtotal),
            discountTotal: Number(fullTransaction.discountTotal || 0),
            totalAmount: Number(fullTransaction.totalAmount),
            paidAmount: Number(fullTransaction.paidAmount || 0),
            items: fullTransaction.items.map((item) => ({
              ...item,
              unitPrice: Number(item.unitPrice),
              subtotal: Number(item.subtotal),
            })),
          }
        : null;
  },

  async assignBookingToTimetable(
    bookingId: string,
    startTime: Date,
    selections: { serviceId: string; staffId?: string; roomId?: string; isVip?: boolean; discountAmount?: number; customerVoucherId?: string }[],
    promotionIds?: string[],
    nominalVoucherId?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      return await this.assignBookingInTx(tx, bookingId, startTime, selections, promotionIds, nominalVoucherId);
    });
  },

  async assignAndPayBooking(input: {
    bookingId: string;
    startTime: Date;
    selections: { serviceId: string; staffId?: string; roomId?: string; isVip?: boolean; discountAmount?: number; customerVoucherId?: string }[];
    promotionIds?: string[];
    nominalVoucherId?: string;
    cashierId?: string | null;
    payments: {
      paymentMethodId: string;
      amount: number;
      referenceNumber?: string;
      voucherCode?: string;
      notes?: string;
    }[];
  }) {
    return await prisma.$transaction(async (tx) => {
      const createdTx = await this.assignBookingInTx(tx, input.bookingId, input.startTime, input.selections, input.promotionIds, input.nominalVoucherId);
      if (!createdTx) {
        throw new Error("Gagal membuat transaksi untuk booking.");
      }

      if (createdTx.totalAmount <= 0 && (!input.payments || input.payments.length === 0)) {
        return await tx.transaction.update({
          where: { id: createdTx.id },
          data: { status: "COMPLETED" },
        });
      }

      const updatedTx = await PosPaymentRepository.processTransactionPayments(tx, {
        transactionId: createdTx.id,
        cashierId: input.cashierId,
        payments: input.payments,
      });

      if (updatedTx.status !== "COMPLETED") {
        throw new Error("Pembayaran belum lunas.");
      }

      return updatedTx;
    });
  }
};
