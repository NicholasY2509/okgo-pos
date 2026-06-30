import { create } from "zustand";
import { toast } from "sonner";
import {
  getSessionsByDateAction,
  completeSessionAction,
  updateSessionTimeAction,
  startSessionAction,
  getPendingBookingsAction,
  updateSessionStaffAction
} from "../actions/timetable-action";
import { updateBookingStatusAction } from "@/modules/booking/actions/booking-list-actions";

interface TimetableState {
  branchId: string | null;
  date: Date;
  sessions: any[];
  pendingBookings: any[];
  loading: boolean;
  isBookingModalOpen: boolean;
  selectedSessionForInfo: any | null;
  selectedTransactionForPayment: any | null;

  rooms: any[];
  paymentMethods: any[];
  staff: any[];

  setInitialData: (data: { branchId: string; rooms: any[]; paymentMethods: any[]; staff: any[] }) => void;
  setBranchId: (branchId: string) => void;
  setDate: (date: Date) => void;
  setIsBookingModalOpen: (isOpen: boolean) => void;
  setSelectedSessionForInfo: (session: any | null) => void;
  setSelectedTransactionForPayment: (transaction: any | null) => void;

  fetchSessions: () => Promise<void>;
  fetchPendingBookings: () => Promise<void>;

  handleComplete: (sessionId: string) => Promise<void>;
  handleStart: (sessionId: string) => Promise<void>;
  handleUpdateSessionTime: (sessionId: string, newStart: Date, newEnd: Date) => Promise<void>;
  handleProcessBooking: (bookingId: string) => Promise<void>;
  handleUpdateSessionStaff: (sessionId: string, staffId: string) => Promise<void>;
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
  rooms: [],
  paymentMethods: [],
  staff: [],

  setInitialData: ({ branchId, rooms, paymentMethods, staff }) => set({ branchId, rooms, paymentMethods, staff }),
  setBranchId: (branchId) => set({ branchId }),
  setDate: (date) => {
    set({ date });
    get().fetchSessions();
  },
  setIsBookingModalOpen: (isBookingModalOpen) => set({ isBookingModalOpen }),
  setSelectedSessionForInfo: (selectedSessionForInfo) => set({ selectedSessionForInfo }),
  setSelectedTransactionForPayment: (selectedTransactionForPayment) => set({ selectedTransactionForPayment }),

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
    const res = await completeSessionAction(sessionId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Sesi selesai");
      get().fetchSessions();
    }
  },

  handleStart: async (sessionId: string) => {
    const res = await startSessionAction(sessionId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Sesi dimulai");
      get().fetchSessions();
    }
  },

  handleUpdateSessionTime: async (sessionId: string, newStart: Date, newEnd: Date) => {
    const { sessions } = get();
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
    }
  },

  handleProcessBooking: async (bookingId: string) => {
    const { fetchPendingBookings, fetchSessions } = get();
    const res = await updateBookingStatusAction(bookingId, 'PROCESSED');
    if (res.success) {
      toast.success("Booking berhasil diproses");
      fetchPendingBookings();
      fetchSessions();
    } else {
      toast.error(res.error || "Gagal memproses booking");
    }
  },

  handleUpdateSessionStaff: async (sessionId: string, staffId: string) => {
    const { fetchSessions, selectedSessionForInfo } = get();

    if (selectedSessionForInfo && selectedSessionForInfo.id === sessionId) {
      set({ selectedSessionForInfo: { ...selectedSessionForInfo, staffId } });
    }

    // Assuming updateSessionStaffAction is imported, I need to add it to the imports
    const { updateSessionStaffAction } = await import("../actions/timetable-action");
    const res = await updateSessionStaffAction(sessionId, staffId);
    if (res.success) {
      toast.success("Terapis berhasil diubah");
      fetchSessions();
    } else {
      toast.error(res.error || "Gagal mengubah terapis");
    }
  }
}));
