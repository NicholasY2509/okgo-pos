"use server"

import { bookingSchema, BookingInput } from "../schemas/booking";
import { BookingService } from "../services/booking-service";

export async function getBranchesAction() {
  try {
    const branches = await BookingService.getBranches();
    return { success: true, data: JSON.parse(JSON.stringify(branches)) };
  } catch (error: any) {
    return { error: error.message || "Gagal memuat cabang" };
  }
}

export async function getServicesAction(branchId: string) {
  try {
    const services = await BookingService.getServices(branchId);
    return { success: true, data: JSON.parse(JSON.stringify(services)) };
  } catch (error: any) {
    return { error: error.message || "Gagal memuat layanan" };
  }
}

export async function getStaffStatusAction(branchId: string) {
  try {
    const staff = await BookingService.getStaffStatus(branchId);
    return { success: true, data: JSON.parse(JSON.stringify(staff)) };
  } catch (error: any) {
    return { error: error.message || "Gagal memuat status terapis" };
  }
}

export async function getDailyScheduleAction(branchId: string, dateStr: string) {
  try {
    const data = await BookingService.getDailySchedule(branchId, dateStr);
    return { success: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error: any) {
    return { error: error.message || "Gagal memuat jadwal hari ini" };
  }
}

export async function getAvailableSlotsAction(branchId: string, dateStr: string, selections: { serviceId?: string, staffId?: string }[]) {
  try {
    const slots = await BookingService.getAvailableSlots(branchId, dateStr, selections);
    return { success: true, data: JSON.parse(JSON.stringify(slots)) };
  } catch (error: any) {
    return { error: error.message || "Gagal memuat jadwal" };
  }
}

export async function createBookingAction(values: BookingInput) {
  try {
    const validatedFields = bookingSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Data tidak valid" };
    }

    const result = await BookingService.createBooking(validatedFields.data);
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    return { error: error.message || "Gagal membuat booking" };
  }
}

export async function updateBookingAction(bookingId: string, values: BookingInput) {
  try {
    const validatedFields = bookingSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Data tidak valid" };
    }

    const result = await BookingService.updateBooking(bookingId, validatedFields.data);
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    return { error: error.message || "Gagal mengubah booking" };
  }
}

export async function assignBookingToTimetableAction(bookingId: string, selections: { serviceId: string; staffId?: string }[]) {
  try {
    const result = await BookingService.assignBookingToTimetable(bookingId, selections);
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: any) {
    return { error: error.message || "Gagal menugaskan booking ke jadwal" };
  }
}

export async function validateVoucherAction(code: string) {
  try {
    if (!code) return { error: "Kode voucher wajib diisi" };
    const voucher = await BookingService.validateVoucher(code);
    return { success: true, data: JSON.parse(JSON.stringify(voucher)) };
  } catch (error: any) {
    return { error: error.message || "Voucher tidak valid" };
  }
}
