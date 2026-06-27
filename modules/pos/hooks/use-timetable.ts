import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  getSessionsByDateAction,
  completeSessionAction,
  updateSessionTimeAction,
  startSessionAction,
} from "../actions/timetable-action";

interface UseTimetableProps {
  branchId: string;
}

export function useTimetable({ branchId }: UseTimetableProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const fetchSessions = useCallback(async (targetDate: Date) => {
    setLoading(true);
    const res = await getSessionsByDateAction(branchId, targetDate.toISOString());
    if (res.success) {
      setSessions(res.data);
    } else {
      toast.error(res.error || "Gagal memuat jadwal");
    }
    setLoading(false);
  }, [branchId]);

  useEffect(() => {
    fetchSessions(date);
    const interval = setInterval(() => fetchSessions(date), 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [date, fetchSessions]);

  const handleComplete = async (sessionId: string) => {
    const res = await completeSessionAction(sessionId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Sesi selesai");
      fetchSessions(date);
    }
  };

  const handleStart = async (sessionId: string) => {
    const res = await startSessionAction(sessionId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Sesi dimulai");
      fetchSessions(date);
    }
  };

  const handleUpdateSessionTime = async (
    sessionId: string,
    newStart: Date,
    newEnd: Date
  ) => {
    const previousSessions = [...sessions];
    setSessions(
      sessions.map((s) =>
        s.id === sessionId
          ? { ...s, startTime: newStart.toISOString(), endTime: newEnd.toISOString() }
          : s
      )
    );

    const res = await updateSessionTimeAction(sessionId, newStart, newEnd);
    if (res.error) {
      toast.error(res.error);
      setSessions(previousSessions);
    } else {
      toast.success("Waktu sesi diperbarui");
    }
  };

  return {
    date,
    setDate,
    sessions,
    loading,
    isBookingModalOpen,
    setIsBookingModalOpen,
    fetchSessions,
    handleComplete,
    handleStart,
    handleUpdateSessionTime,
  };
}
