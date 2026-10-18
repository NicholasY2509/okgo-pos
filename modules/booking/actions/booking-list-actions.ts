"use server";

import { BookingListService } from "../services/booking-list-service";
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service";

export async function getBookingsAction(branchSlug: string, filters?: { search?: string, from?: Date, to?: Date, isHistory?: boolean }) {
  try {
    await AuthGuardService.requireAuth();
    const bookings = await BookingListService.getBookings(branchSlug, filters);
    return { success: true, data: bookings };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memuat daftar booking";
    return { error: message };
  }
}

export async function updateBookingStatusAction(bookingId: string, status: 'PROCESSED' | 'CANCELLED') {
  try {
    await AuthGuardService.requireAuth();
    const result = await BookingListService.updateBookingStatus(bookingId, status);
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengubah status booking";
    return { error: message };
  }
}

