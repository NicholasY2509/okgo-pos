import { useState, useEffect, useRef } from "react";
import { getDiffString, BUSINESS_HOURS_START, BUSINESS_HOURS_END, TOTAL_HOURS } from "../components/timetable/timetable-utils";

interface UseSessionCardProps {
  session: any;
  onUpdateTime?: (start: Date, end: Date) => void;
}

export function useSessionCard({ session, onUpdateTime }: UseSessionCardProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentTransaction, setSelectedPaymentTransaction] = useState<any>(null);
  const [now, setNow] = useState(new Date());

  const cardRef = useRef<HTMLDivElement>(null);

  // Dragging states
  const [isDragging, setIsDragging] = useState(false);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const [localStart, setLocalStart] = useState<Date>(new Date(session.startTime));
  const [localEnd, setLocalEnd] = useState<Date>(
    session.endTime ? new Date(session.endTime) : new Date(new Date(session.startTime).getTime() + 60 * 60 * 1000)
  );

  useEffect(() => {
    if (!isDragging && !isResizingLeft && !isResizingRight) {
      setLocalStart(new Date(session.startTime));
      setLocalEnd(
        session.endTime
          ? new Date(session.endTime)
          : new Date(new Date(session.startTime).getTime() + 60 * 60 * 1000)
      );
    }
  }, [session.startTime, session.endTime, isDragging, isResizingLeft, isResizingRight]);

  useEffect(() => {
    if (session.status === "COMPLETED") return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [session.status]);

  const startHour = localStart.getHours() + localStart.getMinutes() / 60;
  const endHour = localEnd.getHours() + localEnd.getMinutes() / 60;

  // Clamp to business hours for display
  const clampedStart = Math.max(BUSINESS_HOURS_START, Math.min(startHour, BUSINESS_HOURS_END));
  const clampedEnd = Math.max(BUSINESS_HOURS_START, Math.min(endHour, BUSINESS_HOURS_END));

  const isOutsideBusinessHours = clampedStart >= BUSINESS_HOURS_END || clampedEnd <= BUSINESS_HOURS_START;

  const left = ((clampedStart - BUSINESS_HOURS_START) / TOTAL_HOURS) * 100;
  const width = ((clampedEnd - clampedStart) / TOTAL_HOURS) * 100;

  // Calculate timer (Elapsed time instead of remaining)
  let timerText = "";
  let timerColor = "text-muted-foreground";

  if (session.status === "IN_PROGRESS") {
    if (now < localStart) {
      const diffStr = getDiffString(localStart, now);
      timerText = `Belum Mulai ${diffStr}`;
    } else {
      const diffStr = getDiffString(localStart, now);
      timerText = `Berjalan ${diffStr}`;
      timerColor = now > localEnd ? "text-red-500 font-bold" : "text-primary font-medium";
    }
  } else if (session.status === "SCHEDULED") {
    const diffStr = getDiffString(localStart, now);
    timerText = `- ${diffStr}`;
  } else if (session.status === "COMPLETED") {
    timerText = "Selesai";
  }

  const calculateTimeDelta = (clientX: number, startX: number) => {
    if (!cardRef.current?.parentElement) return 0;
    const parentWidth = cardRef.current.parentElement.offsetWidth;
    const deltaX = clientX - startX;
    const msPerPixel = (TOTAL_HOURS * 60 * 60 * 1000) / parentWidth;
    return deltaX * msPerPixel;
  };

  const snapTo15Mins = (date: Date) => {
    const ms = date.getTime();
    const snapMs = 15 * 60 * 1000;
    return new Date(Math.round(ms / snapMs) * snapMs);
  };

  const handlePointerDown = (e: React.PointerEvent, mode: "drag" | "resizeLeft" | "resizeRight") => {
    // Only allow left click, and prevent dragging completed sessions
    if (e.button !== 0 || session.status === "COMPLETED") return;
    e.stopPropagation();

    // Prevent default to avoid text selection while dragging
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const initialStart = localStart;
    const initialEnd = localEnd;

    if (mode === "drag") setIsDragging(true);
    if (mode === "resizeLeft") setIsResizingLeft(true);
    if (mode === "resizeRight") setIsResizingRight(true);

    const onMove = (moveEvent: PointerEvent) => {
      const rawDeltaMs = calculateTimeDelta(moveEvent.clientX, startX);
      if (mode === "drag") {
        const durationMs = initialEnd.getTime() - initialStart.getTime();
        const snappedStart = snapTo15Mins(new Date(initialStart.getTime() + rawDeltaMs));
        setLocalStart(snappedStart);
        setLocalEnd(new Date(snappedStart.getTime() + durationMs));
      } else if (mode === "resizeLeft") {
        const snappedStart = snapTo15Mins(new Date(initialStart.getTime() + rawDeltaMs));
        if (snappedStart < initialEnd) setLocalStart(snappedStart);
      } else if (mode === "resizeRight") {
        const snappedEnd = snapTo15Mins(new Date(initialEnd.getTime() + rawDeltaMs));
        if (snappedEnd > initialStart) setLocalEnd(snappedEnd);
      }
    };

    const onUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);

      setIsDragging(false);
      setIsResizingLeft(false);
      setIsResizingRight(false);

      const deltaX = Math.abs(upEvent.clientX - startX);
      const isClick = deltaX < 5;

      if (isClick && mode === "drag") {
        setInfoOpen(true);
      } else if (!isClick && onUpdateTime) {
        const rawDeltaMs = calculateTimeDelta(upEvent.clientX, startX);
        if (mode === "drag") {
          const durationMs = initialEnd.getTime() - initialStart.getTime();
          const snappedStart = snapTo15Mins(new Date(initialStart.getTime() + rawDeltaMs));
          onUpdateTime(snappedStart, new Date(snappedStart.getTime() + durationMs));
        } else if (mode === "resizeLeft") {
          const snappedStart = snapTo15Mins(new Date(initialStart.getTime() + rawDeltaMs));
          if (snappedStart < initialEnd) onUpdateTime(snappedStart, initialEnd);
        } else if (mode === "resizeRight") {
          const snappedEnd = snapTo15Mins(new Date(initialEnd.getTime() + rawDeltaMs));
          if (snappedEnd > initialStart) onUpdateTime(initialStart, snappedEnd);
        }
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return {
    infoOpen,
    setInfoOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    selectedPaymentTransaction,
    setSelectedPaymentTransaction,
    cardRef,
    isDragging,
    isResizingLeft,
    isResizingRight,
    isOutsideBusinessHours,
    left,
    width,
    timerText,
    timerColor,
    handlePointerDown,
  };
}
