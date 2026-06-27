"use server";

import { BookingListService } from "../services/booking-list-service";

export async function getBookingsAction(branchSlug: string) {
  try {
    const bookings = await BookingListService.getBookings(branchSlug);
    return { success: true, data: bookings };
  } catch (error: any) {
    return { error: error.message || "Gagal memuat daftar booking" };
  }
}
