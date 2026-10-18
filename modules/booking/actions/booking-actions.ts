"use server"

import { bookingSchema, BookingInput } from "../schemas/booking";
import { BookingService } from "../services/booking-service";
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service";

export async function getBranchesAction() {
  try {
    const branches = await BookingService.getBranches();
    return { success: true, data: JSON.parse(JSON.stringify(branches)) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memuat cabang";
    return { error: message };
  }
}

export async function getServicesAction(branchId: string) {
  try {
    const services = await BookingService.getServices(branchId);
    return { success: true, data: JSON.parse(JSON.stringify(services)) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memuat layanan";
    return { error: message };
  }
}

export async function getStaffStatusAction(branchId: string) {
  try {
    const staff = await BookingService.getStaffStatus(branchId);
    return { success: true, data: JSON.parse(JSON.stringify(staff)) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memuat status terapis";
    return { error: message };
  }
}

export async function getDailyScheduleAction(branchId: string, dateStr: string) {
  try {
    const data = await BookingService.getDailySchedule(branchId, dateStr);
    return { success: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memuat jadwal hari ini";
    return { error: message };
  }
}

export async function getAvailableSlotsAction(branchId: string, dateStr: string, selections: { serviceId?: string, staffId?: string }[]) {
  try {
    const slots = await BookingService.getAvailableSlots(branchId, dateStr, selections);
    return { success: true, data: JSON.parse(JSON.stringify(slots)) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memuat jadwal";
    return { error: message };
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal membuat booking";
    return { error: message };
  }
}

export async function updateBookingAction(bookingId: string, values: BookingInput) {
  try {
    await AuthGuardService.requireAuth();
    const validatedFields = bookingSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Data tidak valid" };
    }

    const result = await BookingService.updateBooking(bookingId, validatedFields.data);
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengubah booking";
    return { error: message };
  }
}

export async function assignBookingToTimetableAction(bookingId: string, startTime: Date, selections: { serviceId: string; staffId?: string }[]) {
  try {
    await AuthGuardService.requireAuth();
    const result = await BookingService.assignBookingToTimetable(bookingId, startTime, selections);
    return { success: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menugaskan booking ke jadwal";
    return { error: message };
  }
}

export async function validateVoucherAction(code: string) {
  try {
    if (!code) return { error: "Kode voucher wajib diisi" };
    const voucher = await BookingService.validateVoucher(code);
    return { success: true, data: JSON.parse(JSON.stringify(voucher)) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Voucher tidak valid";
    return { error: message };
  }
}

