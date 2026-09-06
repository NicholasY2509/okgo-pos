import { BookingRepository } from "../repositories/booking-repository";
import { BookingInput } from "../schemas/booking";

export class BookingService {
  static async getBranches() {
    return await BookingRepository.getBranches();
  }

  static async getServices(branchId: string) {
    return await BookingRepository.getServices(branchId);
  }

  static async getStaffStatus(branchId: string) {
    return await BookingRepository.getStaffStatus(branchId);
  }

  static async getDailySchedule(branchId: string, dateStr: string) {
    return await BookingRepository.getDailySchedule(branchId, dateStr);
  }

  static async getAvailableSlots(branchId: string, dateStr: string, selections: { serviceId?: string, staffId?: string }[]) {
    return await BookingRepository.getAvailableSlots(branchId, dateStr, selections);
  }

  static async createBooking(data: BookingInput) {
    return await BookingRepository.createBooking(data);
  }

  static async updateBooking(bookingId: string, data: BookingInput) {
    return await BookingRepository.updateBooking(bookingId, data);
  }

  static async validateVoucher(code: string) {
    return await BookingRepository.validateVoucher(code);
  }

  static async assignBookingToTimetable(bookingId: string, selections: { serviceId: string; staffId?: string }[]) {
    return await BookingRepository.assignBookingToTimetable(bookingId, selections);
  }
}
