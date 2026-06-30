"use server";

import { BookingListService } from "../services/booking-list-service";

export async function getBookingsAction(branchSlug: string, filters?: { search?: string, from?: Date, to?: Date, isHistory?: boolean }) {
  try {
    const bookings = await BookingListService.getBookings(branchSlug, filters);
    return { success: true, data: bookings };
  } catch (error: any) {
    return { error: error.message || "Gagal memuat daftar booking" };
  }
}

export async function updateBookingStatusAction(bookingId: string, status: 'PROCESSED' | 'CANCELLED') {
  try {
    const result = await BookingListService.updateBookingStatus(bookingId, status);
    return { success: true, data: result };
  } catch (error: any) {
    return { error: error.message || `Gagal mengubah status booking` };
  }
}
