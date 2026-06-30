"use server"

import { TimetableService } from "../services/timetable-service";

export async function getActiveSessionsAction(branchId: string) {
  try {
    const sessions = await TimetableService.getActiveSessions(branchId);
    return { success: true, data: sessions };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch active sessions" };
  }
}

export async function getSessionsByDateAction(branchId: string, dateStr: string) {
  try {
    const sessions = await TimetableService.getSessionsByDate(branchId, dateStr);
    return { success: true, data: sessions };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch sessions by date" };
  }
}

export async function completeSessionAction(sessionId: string) {
  try {
    await TimetableService.completeSession(sessionId);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal menyelesaikan sesi" };
  }
}

export async function updateSessionTimeAction(sessionId: string, startTime: Date, endTime: Date) {
  try {
    await TimetableService.updateSessionTime(sessionId, startTime, endTime);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal memperbarui waktu sesi" };
  }
}

export async function updateSessionStaffAction(sessionId: string, staffId: string) {
  try {
    await TimetableService.updateSessionStaff(sessionId, staffId);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal mengubah terapis" };
  }
}

export async function startSessionAction(sessionId: string) {
  try {
    await TimetableService.startSession(sessionId);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal memulai sesi" };
  }
}

export async function getPendingBookingsAction(branchId: string) {
  try {
    const bookings = await TimetableService.getPendingBookings(branchId);
    return { success: true, data: bookings };
  } catch (error: any) {
    return { error: error.message || "Gagal memuat booking" };
  }
}
