import { prisma } from "@/lib/prisma";
import { BookingInput } from "../schemas/booking";
import { startOfDay, endOfDay, addMinutes, isBefore, addHours, format } from "date-fns";

export const BookingRepository = {
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
    const staff = await prisma.staff.findMany({
      where: { branchStaffs: { some: { branchId } }, isActive: true },
      orderBy: { firstName: 'asc' }
    });

    const activeSessions = await prisma.serviceSession.findMany({
      where: {
        branchId,
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

    const staff = await prisma.staff.findMany({
      where: { branchStaffs: { some: { branchId } }, isActive: true },
      orderBy: { firstName: 'asc' }
    });

    const rooms = await prisma.room.findMany({
      where: { branchId, isActive: true }
    });

    const sessions = await prisma.serviceSession.findMany({
      where: {
        branchId,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        startTime: { gte: start, lte: end }
      },
      select: {
        id: true,
        staffId: true,
        roomId: true,
        startTime: true,
        endTime: true,
      }
    });

    const staffSchedules = staff.map(s => ({
      ...s,
      sessions: sessions
        .filter(session => session.staffId === s.id)
        .map(sess => ({
          startTime: sess.startTime,
          endTime: sess.endTime || addMinutes(sess.startTime!, 60),
        }))
    }));

    const totalCapacity = rooms.reduce((acc, r) => acc + (r.capacity || 1), 0);
    const roomSessions = sessions.filter(s => s.roomId).map(s => ({
      startTime: s.startTime,
      endTime: s.endTime || addMinutes(s.startTime!, 60)
    }));

    return { staffSchedules, roomSessions, totalCapacity, rooms };
  },

  async getAvailableSlots(branchId: string, dateStr: string, selections: { serviceId?: string, staffId?: string }[]) {
    const date = new Date(dateStr);
    const start = startOfDay(date);
    const end = endOfDay(date);

    let maxDuration = 60;
    const serviceIds = selections.map(s => s.serviceId).filter(id => id) as string[];
    let services: any[] = [];
    if (serviceIds.length > 0) {
      services = await prisma.product.findMany({
        where: { id: { in: serviceIds } }
      });
      for (const service of services) {
        if (service.duration && service.duration > maxDuration) {
          maxDuration = service.duration;
        }
      }
    }

    const rooms = await prisma.room.findMany({ where: { branchId, isActive: true } });
    const staff = await prisma.staff.findMany({ where: { branchStaffs: { some: { branchId } }, isActive: true } });

    if (rooms.length < selections.length || staff.length < selections.length) return [];

    const existingSessions = await prisma.serviceSession.findMany({
      where: {
        branchId,
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
      }
    });

    const businessStart = 8;
    const businessEnd = 22;
    const slots = [];
    const now = new Date();

    const minTime = addHours(now, 2);

    for (let hour = businessStart; hour < businessEnd; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = addMinutes(slotStart, maxDuration);

      if (isBefore(slotStart, minTime)) continue;

      if (slotEnd.getHours() > businessEnd || (slotEnd.getHours() === businessEnd && slotEnd.getMinutes() > 0)) {
        continue;
      }

      const roomSessionCounts = new Map<string, number>();
      const busyStaffIds = new Set<string>();

      for (const session of existingSessions) {
        if (!session.startTime) continue;
        const sessionStart = session.startTime;
        const sessionEnd = session.endTime || addMinutes(sessionStart, 60);

        if (slotStart < sessionEnd && slotEnd > sessionStart) {
          roomSessionCounts.set(session.roomId, (roomSessionCounts.get(session.roomId) || 0) + 1);
          if (session.staffId) {
            busyStaffIds.add(session.staffId);
          }
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

      const vipServicesCount = services.filter(s => s.isVip).length;
      const standardServicesCount = services.length - vipServicesCount;

      const availableVipRooms = availableRooms.filter(r => r.isVip).length;
      const availableStandardRooms = availableRooms.filter(r => !r.isVip).length;

      // If selections is empty, we just need at least 1 room available
      if (selections.length === 0) {
        if (availableRooms.length < 1) continue;
        slots.push(slotStart.toISOString());
        continue;
      }

      if (availableRooms.length < selections.length) continue;
      if (availableVipRooms < vipServicesCount || availableStandardRooms < standardServicesCount) continue;

      let canFulfillAll = true;

      for (const sel of selections) {
        if (sel.staffId) {
          const staffIsAvailable = availableStaff.some(s => s.id === sel.staffId);
          if (!staffIsAvailable) {
            canFulfillAll = false;
            break;
          }
        }
      }

      if (canFulfillAll && availableStaff.length >= selections.length) {
        const requestedSpecificStaffIds = selections.filter(s => s.staffId).map(s => s.staffId);
        const uniqueStaffIds = new Set(requestedSpecificStaffIds);
        if (uniqueStaffIds.size < requestedSpecificStaffIds.length) {
          canFulfillAll = false;
        }
      }

      if (canFulfillAll && availableStaff.length >= selections.length) {
        slots.push(slotStart.toISOString());
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

      const rooms = await tx.room.findMany({ where: { branchId: data.branchId, isActive: true } });
      const staffList = await tx.staff.findMany({ where: { branchStaffs: { some: { branchId: data.branchId } }, isActive: true } });

      const existingSessions = await tx.serviceSession.findMany({
        where: {
          branchId: data.branchId,
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          startTime: {
            gte: startOfDay(slotStart),
            lte: endOfDay(slotStart)
          }
        }
      });

      const roomSessionCounts = new Map<string, number>();
      const busyStaffIds = new Set<string>();

      for (const session of existingSessions) {
        if (!session.startTime) continue;
        const sessionStart = session.startTime;
        const sessionEnd = session.endTime || addMinutes(sessionStart, 60);

        if (slotStart < sessionEnd && slotEnd > sessionStart) {
          roomSessionCounts.set(session.roomId, (roomSessionCounts.get(session.roomId) || 0) + 1);
          if (session.staffId) {
            busyStaffIds.add(session.staffId);
          }
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
        }
      });
      let unassignedCountInSlot = 0;
      for (const bkg of unassignedBookings) {
        if (!bkg.scheduledStartTime) continue;
        const bkgStart = bkg.scheduledStartTime;
        const bkgEnd = addMinutes(bkgStart, bkg.estimatedDuration);
        if (slotStart < bkgEnd && slotEnd > bkgStart) {
          const assignedCount = existingSessions.filter(s => s.bookingId === bkg.id && s.startTime && slotStart < (s.endTime || addMinutes(s.startTime, 60)) && slotEnd > s.startTime).length;
          unassignedCountInSlot += Math.max(0, (bkg.guestCount || 1) - assignedCount);
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
          isAssignedToTimetable: transactionItems.length === (data.selections || []).length && (data.selections || []).length > 0,
          items: transactionItems.length > 0 ? {
            create: transactionItems.map(item => ({
              serviceId: item.serviceId,
              itemNameSnapshot: item.itemNameSnapshot,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              quantity: item.quantity,
              ...(item._appliedVoucherId ? { appliedVoucher: { connect: { id: item._appliedVoucherId } } } : {})
            }))
          } : undefined
        },
        include: { items: { include: { appliedVoucher: { include: { voucherPacket: { include: { product: true } } } } } } }
      });

      const createdSessions = [];
      for (let i = 0; i < transactionItems.length; i++) {
        const itemSpec = transactionItems[i];

        const sessionSlotEnd = addMinutes(slotStart, itemSpec._duration);

        const session = await tx.serviceSession.create({
          data: {
            bookingId: booking.id,
            customerId: customer.id,
            serviceId: itemSpec.serviceId,
            staffId: itemSpec._assignedStaffId || undefined,
            roomId: itemSpec._assignedRoomId,
            branchId: data.branchId,
            status: "SCHEDULED",
            startTime: slotStart,
            endTime: sessionSlotEnd,
          }
        });
        createdSessions.push(session);
      }

      return { booking, serviceSessions: createdSessions };
    });
  },

  async updateBooking(bookingId: string, data: BookingInput) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!existing || existing.status !== "PENDING") throw new Error("Hanya booking dengan status PENDING yang dapat diubah.");

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

      const rooms = await tx.room.findMany({ where: { branchId: data.branchId, isActive: true } });
      const staffList = await tx.staff.findMany({ where: { branchStaffs: { some: { branchId: data.branchId } }, isActive: true } });

      const existingSessions = await tx.serviceSession.findMany({
        where: {
          branchId: data.branchId,
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          startTime: {
            gte: startOfDay(slotStart),
            lte: endOfDay(slotStart)
          }
        }
      });

      const roomSessionCounts = new Map<string, number>();
      const busyStaffIds = new Set<string>();

      for (const session of existingSessions) {
        if (!session.startTime) continue;
        const sessionStart = session.startTime;
        const sessionEnd = session.endTime || addMinutes(sessionStart, 60);

        if (slotStart < sessionEnd && slotEnd > sessionStart) {
          roomSessionCounts.set(session.roomId, (roomSessionCounts.get(session.roomId) || 0) + 1);
          if (session.staffId) {
            busyStaffIds.add(session.staffId);
          }
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
        }
      });
      let unassignedCountInSlot = 0;
      for (const bkg of unassignedBookings) {
        if (!bkg.scheduledStartTime) continue;
        const bkgStart = bkg.scheduledStartTime;
        const bkgEnd = addMinutes(bkgStart, bkg.estimatedDuration);
        if (slotStart < bkgEnd && slotEnd > bkgStart) {
          const assignedCount = existingSessions.filter(s => s.bookingId === bkg.id && s.startTime && slotStart < (s.endTime || addMinutes(s.startTime, 60)) && slotEnd > s.startTime).length;
          unassignedCountInSlot += Math.max(0, (bkg.guestCount || 1) - assignedCount);
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
          items: {
            create: transactionItems.map((item: any) => ({
              serviceId: item.serviceId,
              itemNameSnapshot: item.itemNameSnapshot,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              quantity: item.quantity,
              ...(item._appliedVoucherId ? { appliedVoucher: { connect: { id: item._appliedVoucherId } } } : {})
            }))
          }
        }
      });

      const createdSessions = [];
      for (let i = 0; i < transactionItems.length; i++) {
        const itemSpec = transactionItems[i];

        const sessionSlotEnd = addMinutes(slotStart, itemSpec._duration);

        const session = await tx.serviceSession.create({
          data: {
            bookingId: booking.id,
            customerId: customer.id,
            serviceId: itemSpec.serviceId,
            staffId: itemSpec._assignedStaffId || undefined,
            roomId: itemSpec._assignedRoomId,
            branchId: data.branchId,
            status: "SCHEDULED",
            startTime: slotStart,
            endTime: sessionSlotEnd,
          }
        });
        createdSessions.push(session);
      }

      return { booking, serviceSessions: createdSessions };
    });
  },

  async assignBookingToTimetable(bookingId: string, selections: { serviceId: string; staffId?: string }[]) {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { items: { include: { appliedVoucher: { include: { voucherPacket: { include: { product: true } } } } } }, serviceSessions: true }
      });

      if (!booking) throw new Error("Booking tidak ditemukan");
      if (booking.isAssignedToTimetable) throw new Error("Booking sudah ditugaskan ke jadwal");

      const slotStart = booking.scheduledStartTime || new Date();

      const services = await tx.product.findMany({
        where: { id: { in: selections.map(s => s.serviceId) } }
      });

      let maxDuration = 0;
      services.forEach((s: any) => {
        if (s.duration > maxDuration) maxDuration = s.duration;
      });

      const slotEnd = addMinutes(slotStart, maxDuration);

      const rooms = await tx.room.findMany({
        where: { branchId: booking.branchId, isActive: true }
      });

      const staffList = await tx.staff.findMany({
        where: {
          branchStaffs: { some: { branchId: booking.branchId } },
          isActive: true
        }
      });

      const existingSessions = await tx.serviceSession.findMany({
        where: {
          branchId: booking.branchId,
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          startTime: {
            gte: startOfDay(slotStart),
            lte: endOfDay(slotStart)
          }
        }
      });

      const roomSessionCounts = new Map<string, number>();
      const busyStaffIds = new Set<string>();

      for (const session of existingSessions) {
        if (!session.startTime) continue;
        const sessionStart = session.startTime;
        const sessionEnd = session.endTime || addMinutes(sessionStart, 60);

        if (slotStart < sessionEnd && slotEnd > sessionStart) {
          roomSessionCounts.set(session.roomId, (roomSessionCounts.get(session.roomId) || 0) + 1);
          if (session.staffId) {
            busyStaffIds.add(session.staffId);
          }
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
        }
      });
      let unassignedCountInSlot = 0;
      for (const bkg of unassignedBookings) {
        if (!bkg.scheduledStartTime) continue;
        const bkgStart = bkg.scheduledStartTime;
        const bkgEnd = addMinutes(bkgStart, bkg.estimatedDuration);
        if (slotStart < bkgEnd && slotEnd > bkgStart) {
          const assignedCount = existingSessions.filter(s => s.bookingId === bkg.id && s.startTime && slotStart < (s.endTime || addMinutes(s.startTime, 60)) && slotEnd > s.startTime).length;
          unassignedCountInSlot += Math.max(0, (bkg.guestCount || 1) - assignedCount);
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

      const vipServicesCount = services.filter((s: any) => s.isVip).length;
      const standardServicesCount = services.length - vipServicesCount;

      const availableVipRooms = availableRooms.filter(r => r.isVip).length;
      const availableStandardRooms = availableRooms.filter(r => !r.isVip).length;

      const activeSelections = selections.filter(s => s.serviceId);
      if (activeSelections.length === 0) {
        throw new Error("Pilih setidaknya satu layanan.");
      }

      if (availableRooms.length < selections.length) {
        throw new Error("Kapasitas ruangan tidak mencukupi untuk waktu ini.");
      }

      if (availableVipRooms < vipServicesCount || availableStandardRooms < standardServicesCount || availableStaff.length < activeSelections.length) {
        throw new Error("Kapasitas ruangan/terapis tidak mencukupi untuk waktu ini.");
      }

      let subtotal = 0;
      const transactionItems = [];

      for (const sel of selections) {
        if (!sel.serviceId) continue;
        const service = services.find((s: any) => s.id === sel.serviceId);
        if (!service) throw new Error("Service not found");

        let assignedRoomIndex = availableRooms.findIndex(r => r.isVip === service.isVip);
        if (assignedRoomIndex === -1) {
          throw new Error(`Tidak ada ruangan ${service.isVip ? 'VIP' : 'Standar'} yang tersedia.`);
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

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          isAssignedToTimetable: true,
          status: "PROCESSED",
          totalAmount: subtotal,
          estimatedDuration: maxDuration,
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
          totalAmount: subtotal,
          status: 'PENDING',
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
            startTime: slotStart,
            endTime: sessionSlotEnd,
            transactionItemId: txItem.id,
          }
        });
        createdSessions.push(session);
      }

      return true;
    });
  }
};
