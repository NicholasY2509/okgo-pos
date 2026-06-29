"use server"

import { bookingSchema, BookingInput } from "../schemas/booking";
import { BookingService } from "../services/booking-service";

export async function getBranchesAction() {
  try {
    const branches = await BookingService.getBranches();
    return { success: true, data: branches };
  } catch (error: any) {
    return { error: error.message || "Gagal memuat cabang" };
  }
}

export async function getServicesAction(branchId: string) {
  try {
    const services = await BookingService.getServices(branchId);
    return { success: true, data: services };
  } catch (error: any) {
    return { error: error.message || "Gagal memuat layanan" };
  }
}

export async function getStaffStatusAction(branchId: string) {
  try {
    const staff = await BookingService.getStaffStatus(branchId);
    return { success: true, data: staff };
  } catch (error: any) {
    return { error: error.message || "Gagal memuat status terapis" };
  }
}

export async function getDailyScheduleAction(branchId: string, dateStr: string) {
  try {
    const data = await BookingService.getDailySchedule(branchId, dateStr);
    return { success: true, data };
  } catch (error: any) {
    return { error: error.message || "Gagal memuat jadwal hari ini" };
  }
}

export async function getAvailableSlotsAction(branchId: string, dateStr: string, selections: {serviceId: string, staffId?: string}[]) {
  try {
    const slots = await BookingService.getAvailableSlots(branchId, dateStr, selections);
    return { success: true, data: slots };
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
    return { success: true, data: result };
  } catch (error: any) {
    return { error: error.message || "Gagal membuat booking" };
  }
}
