"use server"

import { TimetableService } from "../services/timetable-service";
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service";

export async function getActiveSessionsAction(branchId: string) {
  try {
    await AuthGuardService.requireAuth();
    const sessions = await TimetableService.getActiveSessions(branchId);
    return { success: true, data: sessions };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch active sessions";
    return { error: message };
  }
}

export async function getSessionsByDateAction(branchId: string, dateStr: string) {
  try {
    await AuthGuardService.requireAuth();
    const sessions = await TimetableService.getSessionsByDate(branchId, dateStr);
    return { success: true, data: sessions };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch sessions by date";
    return { error: message };
  }
}

export async function completeSessionAction(sessionId: string) {
  try {
    await AuthGuardService.requireAuth();
    await TimetableService.completeSession(sessionId);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menyelesaikan sesi";
    return { error: message };
  }
}

export async function updateSessionTimeAction(sessionId: string, startTime: Date, endTime: Date) {
  try {
    await AuthGuardService.requireAuth();
    await TimetableService.updateSessionTime(sessionId, startTime, endTime);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui waktu sesi";
    return { error: message };
  }
}

export async function updateSessionStaffAction(sessionId: string, staffId: string) {
  try {
    await AuthGuardService.requireAuth();
    await TimetableService.updateSessionStaff(sessionId, staffId);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengubah terapis";
    return { error: message };
  }
}

export async function updateSessionRoomAction(sessionId: string, roomId: string) {
  try {
    await AuthGuardService.requireAuth();
    await TimetableService.updateSessionRoom(sessionId, roomId);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memindahkan ruangan";
    return { error: message };
  }
}

export async function startSessionAction(sessionId: string) {
  try {
    await AuthGuardService.requireAuth();
    await TimetableService.startSession(sessionId);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memulai sesi";
    return { error: message };
  }
}

export async function getPendingBookingsAction(branchId: string) {
  try {
    await AuthGuardService.requireAuth();
    const bookings = await TimetableService.getPendingBookings(branchId);
    return { success: true, data: bookings };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memuat booking";
    return { error: message };
  }
}

export async function getLoadableBookingsAction(branchId: string) {
  try {
    await AuthGuardService.requireAuth();
    const bookings = await TimetableService.getLoadableBookings(branchId);
    return { success: true, data: bookings };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memuat booking";
    return { error: message };
  }
}
