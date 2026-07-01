import { prisma } from "@/lib/prisma";
import { BookingInput } from "../schemas/booking";
import { startOfDay, endOfDay, addMinutes, isBefore, addHours } from "date-fns";

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
      orderBy: { name: 'asc' }
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

  async getAvailableSlots(branchId: string, dateStr: string, selections: { serviceId: string, staffId?: string }[]) {
    const date = new Date(dateStr);
    const start = startOfDay(date);
    const end = endOfDay(date);

    let maxDuration = 60;
    const serviceIds = selections.map(s => s.serviceId);
    const services = await prisma.product.findMany({
      where: { id: { in: serviceIds } }
    });
    for (const service of services) {
      if (service.duration && service.duration > maxDuration) {
        maxDuration = service.duration;
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

      const availableRooms = [];
      for (const r of rooms) {
        const count = roomSessionCounts.get(r.id) || 0;
        const capacity = r.capacity || 1;
        const remaining = Math.max(0, capacity - count);
        for (let i = 0; i < remaining; i++) {
          availableRooms.push(r);
        }
      }

      const availableStaff = staff.filter(s => !busyStaffIds.has(s.id));

      const vipServicesCount = services.filter(s => s.isVip).length;
      const standardServicesCount = services.length - vipServicesCount;

      const availableVipRooms = availableRooms.filter(r => r.isVip).length;
      const availableStandardRooms = availableRooms.filter(r => !r.isVip).length;

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

      const serviceIds = data.selections.map(s => s.serviceId);
      const services = await tx.product.findMany({
        where: { id: { in: serviceIds } }
      });

      let maxDuration = 60;
      for (const s of services) {
        if (s.duration && s.duration > maxDuration) maxDuration = s.duration;
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

      const availableRooms = [];
      for (const r of rooms) {
        const count = roomSessionCounts.get(r.id) || 0;
        const capacity = r.capacity || 1;
        const remaining = Math.max(0, capacity - count);
        for (let i = 0; i < remaining; i++) {
          availableRooms.push(r);
        }
      }

      const availableStaff = staffList.filter(s => !busyStaffIds.has(s.id));

      const vipServicesCount = services.filter(s => s.isVip).length;
      const standardServicesCount = services.length - vipServicesCount;

      const availableVipRooms = availableRooms.filter(r => r.isVip).length;
      const availableStandardRooms = availableRooms.filter(r => !r.isVip).length;

      if (availableVipRooms < vipServicesCount || availableStandardRooms < standardServicesCount || availableStaff.length < data.selections.length) {
        throw new Error("Kapasitas ruangan/terapis tidak mencukupi untuk waktu ini.");
      }

      let subtotal = 0;
      const transactionItems = [];

      for (const sel of data.selections) {
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

      const booking = await tx.booking.create({
        data: {
          branchId: data.branchId,
          customerId: customer.id,
          bookingNumber,
          customerName: customer.name,
          customerPhone: customer.phone,
          totalAmount: subtotal,
          status: "PENDING",
          items: {
            create: transactionItems.map(item => ({
              serviceId: item.serviceId,
              itemNameSnapshot: item.itemNameSnapshot,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              quantity: item.quantity
            }))
          }
        },
        include: { items: true }
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
  }
};
