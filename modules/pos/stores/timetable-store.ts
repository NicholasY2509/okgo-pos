import { create } from "zustand";
import { toast } from "sonner";
import { io } from "socket.io-client";
import {
  getSessionsByDateAction,
  completeSessionAction,
  updateSessionTimeAction,
  startSessionAction,
  getPendingBookingsAction,
  updateSessionStaffAction
} from "../actions/timetable-action";
import { updateBookingStatusAction } from "@/modules/booking/actions/booking-list-actions";

function broadcastRoomSessionUpdate(payload: {
  branchId?: string | null;
  roomId?: string | null;
  sessionId?: string;
  action?: string;
}) {
  if (typeof window === "undefined") return;
  const socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    `${window.location.protocol}//${window.location.hostname}:3001`;
  const socket = io(socketUrl, {
    transports: ["websocket", "polling"],
  });
  socket.emit("service_status_changed", payload);
  setTimeout(() => socket.disconnect(), 1000);
}

interface TimetableState {
  branchId: string | null;
  date: Date;
  sessions: any[];
  pendingBookings: any[];
  loading: boolean;
  isBookingModalOpen: boolean;
  selectedSessionForInfo: any | null;
  selectedTransactionForPayment: any | null;
  selectedBookingForAssignment: any | null;

  rooms: any[];
  paymentMethods: any[];
  staff: any[];
  brandSetting: any | null;
  businessHoursStart: number;
  totalHours: number;

  setInitialData: (data: { branchId: string; rooms: any[]; paymentMethods: any[]; staff: any[]; brandSetting?: any }) => void;
  setBranchId: (branchId: string) => void;
  setDate: (date: Date) => void;
  setIsBookingModalOpen: (isOpen: boolean) => void;
  setSelectedSessionForInfo: (session: any | null) => void;
  setSelectedTransactionForPayment: (transaction: any | null) => void;
  setSelectedBookingForAssignment: (booking: any | null) => void;

  fetchSessions: () => Promise<void>;
  fetchPendingBookings: () => Promise<void>;

  handleComplete: (sessionId: string) => Promise<void>;
  handleStart: (sessionId: string) => Promise<void>;
  handleUpdateSessionTime: (sessionId: string, newStart: Date, newEnd: Date) => Promise<void>;
  handleProcessBooking: (bookingId: string) => Promise<void>;
  handleUpdateSessionStaff: (sessionId: string, staffId: string) => Promise<void>;
  handleUpdateSessionRoom: (sessionId: string, roomId: string) => Promise<void>;
}

export const useTimetableStore = create<TimetableState>((set, get) => ({
  branchId: null,
  date: new Date(),
  sessions: [],
  pendingBookings: [],
  loading: true,
  isBookingModalOpen: false,
  selectedSessionForInfo: null,
  selectedTransactionForPayment: null,
  selectedBookingForAssignment: null,
  rooms: [],
  paymentMethods: [],
  staff: [],
  brandSetting: null,
  businessHoursStart: 8,
  totalHours: 14,

  setInitialData: ({ branchId, rooms, paymentMethods, staff, brandSetting }) => {
    let businessHoursStart = 8;
    let businessHoursEnd = 22;

    if (brandSetting) {
      if (brandSetting.businessStartTime) {
        businessHoursStart = parseInt(brandSetting.businessStartTime.split(':')[0], 10);
      }
      if (brandSetting.businessEndTime) {
        businessHoursEnd = parseInt(brandSetting.businessEndTime.split(':')[0], 10);
      }
    }

    const totalHours = businessHoursEnd - businessHoursStart;

    set({ branchId, rooms, paymentMethods, staff, brandSetting, businessHoursStart, totalHours });
  },
  setBranchId: (branchId) => set({ branchId }),
  setDate: (date) => {
    set({ date });
    get().fetchSessions();
    get().fetchPendingBookings();
  },
  setIsBookingModalOpen: (isBookingModalOpen) => set({ isBookingModalOpen }),
  setSelectedSessionForInfo: (selectedSessionForInfo) => set({ selectedSessionForInfo }),
  setSelectedTransactionForPayment: (selectedTransactionForPayment) => set({ selectedTransactionForPayment }),
  setSelectedBookingForAssignment: (selectedBookingForAssignment) => set({ selectedBookingForAssignment }),

  fetchSessions: async () => {
    const { branchId, date } = get();
    if (!branchId) return;

    set({ loading: true });
    const res = await getSessionsByDateAction(branchId, date.toISOString());
    if (res.success && res.data) {
      const updates: Partial<TimetableState> = { sessions: res.data, loading: false };

      const { selectedSessionForInfo } = get();
      if (selectedSessionForInfo) {
        const updatedSelectedSession = res.data.find((s: any) => s.id === selectedSessionForInfo.id);
        if (updatedSelectedSession) {
          updates.selectedSessionForInfo = updatedSelectedSession;
        }
      }

      set(updates);
    } else {
      toast.error(res.error || "Gagal memuat jadwal");
      set({ loading: false });
    }
  },

  fetchPendingBookings: async () => {
    const { branchId } = get();
    if (!branchId) return;

    const res = await getPendingBookingsAction(branchId);
    if (res.success && res.data) {
      set({ pendingBookings: res.data });
    }
  },

  handleComplete: async (sessionId: string) => {
    const { branchId, sessions } = get();
    const target = sessions.find((s) => s.id === sessionId);
    const res = await completeSessionAction(sessionId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Sesi selesai");
      broadcastRoomSessionUpdate({
        branchId,
        roomId: target?.roomId,
        sessionId,
        action: "complete",
      });
      get().fetchSessions();
    }
  },

  handleStart: async (sessionId: string) => {
    const { branchId, sessions } = get();
    const target = sessions.find((s) => s.id === sessionId);
    const res = await startSessionAction(sessionId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Sesi dimulai");
      broadcastRoomSessionUpdate({
        branchId,
        roomId: target?.roomId,
        sessionId,
        action: "start",
      });
      get().fetchSessions();
    }
  },

  handleUpdateSessionTime: async (sessionId: string, newStart: Date, newEnd: Date) => {
    const { branchId, sessions } = get();
    const target = sessions.find((s) => s.id === sessionId);
    const previousSessions = [...sessions];

    // Optimistic update
    set({
      sessions: sessions.map((s) =>
        s.id === sessionId
          ? { ...s, startTime: newStart.toISOString(), endTime: newEnd.toISOString() }
          : s
      )
    });

    const res = await updateSessionTimeAction(sessionId, newStart, newEnd);
    if (res.error) {
      toast.error(res.error);
      // Revert on error
      set({ sessions: previousSessions });
    } else {
      toast.success("Waktu sesi diperbarui");
      broadcastRoomSessionUpdate({
        branchId,
        roomId: target?.roomId,
        sessionId,
        action: "time_updated",
      });
    }
  },

  handleProcessBooking: async (bookingId: string) => {
    const { branchId, fetchPendingBookings, fetchSessions, pendingBookings } = get();
    const booking = pendingBookings.find(b => b.id === bookingId);
    if (booking && !booking.isAssignedToTimetable) {
      // If the booking hasn't been assigned to the timetable yet (no services selected)
      set({ selectedBookingForAssignment: booking });
      return;
    }

    const res = await updateBookingStatusAction(bookingId, 'PROCESSED');
    if (res.success) {
      toast.success("Booking berhasil diproses");
      broadcastRoomSessionUpdate({ branchId, action: "booking_processed" });
      fetchPendingBookings();
      fetchSessions();
    } else {
      toast.error(res.error || "Gagal memproses booking");
    }
  },

  handleUpdateSessionStaff: async (sessionId: string, staffId: string) => {
    const { branchId, sessions, fetchSessions, selectedSessionForInfo } = get();
    const target = sessions.find((s) => s.id === sessionId);

    if (selectedSessionForInfo && selectedSessionForInfo.id === sessionId) {
      set({ selectedSessionForInfo: { ...selectedSessionForInfo, staffId } });
    }

    const { updateSessionStaffAction } = await import("../actions/timetable-action");
    const res = await updateSessionStaffAction(sessionId, staffId);
    if (res.success) {
      toast.success("Terapis berhasil diubah");
      broadcastRoomSessionUpdate({
        branchId,
        roomId: target?.roomId,
        sessionId,
        action: "staff_updated",
      });
      fetchSessions();
    } else {
      toast.error(res.error || "Gagal mengubah terapis");
    }
  },

  handleUpdateSessionRoom: async (sessionId: string, roomId: string) => {
    const { branchId, sessions, fetchSessions, selectedSessionForInfo } = get();
    const previousRoomId = sessions.find((s) => s.id === sessionId)?.roomId;

    if (selectedSessionForInfo && selectedSessionForInfo.id === sessionId) {
      set({ selectedSessionForInfo: { ...selectedSessionForInfo, roomId } });
    }

    const { updateSessionRoomAction } = await import("../actions/timetable-action");
    const res = await updateSessionRoomAction(sessionId, roomId);
    if (res.success) {
      toast.success("Ruangan berhasil dipindahkan");
      if (previousRoomId && previousRoomId !== roomId) {
        broadcastRoomSessionUpdate({
          branchId,
          roomId: previousRoomId,
          sessionId,
          action: "room_moved_out",
        });
      }
      broadcastRoomSessionUpdate({
        branchId,
        roomId,
        sessionId,
        action: "room_assigned",
      });
      fetchSessions();
    } else {
      toast.error(res.error || "Gagal memindahkan ruangan");
    }
  }
}));
