import { useState, useEffect, useRef } from "react";
import { getDiffString } from "../components/timetable/timetable-utils";
import { useTimetableStore } from "../stores/timetable-store";

interface UseSessionCardProps {
  session: any;
  onUpdateTime?: (start: Date, end: Date) => void;
}

export function useSessionCard({ session, onUpdateTime }: UseSessionCardProps) {
  const { setSelectedSessionForInfo, businessHoursStart, totalHours } = useTimetableStore();
  const businessHoursEnd = businessHoursStart + totalHours;
  const [now, setNow] = useState(new Date());

  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const getEffectiveStart = () => session.actualStartTime ? new Date(session.actualStartTime) : new Date(session.startTime);
  const getEffectiveEnd = () => {
    if (session.status === "COMPLETED" && session.actualEndTime) {
      return new Date(session.actualEndTime);
    }
    const start = getEffectiveStart();
    const scheduledStart = new Date(session.startTime);
    const scheduledEnd = session.endTime ? new Date(session.endTime) : new Date(scheduledStart.getTime() + 60 * 60 * 1000);
    const durationMs = scheduledEnd.getTime() - scheduledStart.getTime();
    return new Date(start.getTime() + durationMs);
  };

  const [localStart, setLocalStart] = useState<Date>(getEffectiveStart());
  const [localEnd, setLocalEnd] = useState<Date>(getEffectiveEnd());

  useEffect(() => {
    if (!isDragging && !isResizingLeft && !isResizingRight) {
      setLocalStart(getEffectiveStart());
      setLocalEnd(getEffectiveEnd());
    }
  }, [session.startTime, session.endTime, session.actualStartTime, session.actualEndTime, session.status, isDragging, isResizingLeft, isResizingRight]);

  useEffect(() => {
    if (session.status === "COMPLETED") return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [session.status]);

  const startHour = localStart.getHours() + localStart.getMinutes() / 60;
  const endHour = localEnd.getHours() + localEnd.getMinutes() / 60;

  const clampedStart = Math.max(businessHoursStart, Math.min(startHour, businessHoursEnd));
  const clampedEnd = Math.max(businessHoursStart, Math.min(endHour, businessHoursEnd));

  const isOutsideBusinessHours = clampedStart >= businessHoursEnd || clampedEnd <= businessHoursStart;

  const left = ((clampedStart - businessHoursStart) / totalHours) * 100;
  const width = ((clampedEnd - clampedStart) / totalHours) * 100;

  const actualStart = session.actualStartTime ? new Date(session.actualStartTime) : localStart;

  let timerText = "";
  let timerColor = "text-muted-foreground";

  if (session.status === "IN_PROGRESS") {
    if (now < actualStart) {
      const diffStr = getDiffString(actualStart, now);
      timerText = `Belum Mulai ${diffStr}`;
    } else {
      const diffStr = getDiffString(actualStart, now);
      timerText = `Berjalan ${diffStr}`;

      const durationMs = localEnd.getTime() - localStart.getTime();
      const expectedActualEnd = new Date(actualStart.getTime() + durationMs);
      timerColor = now > expectedActualEnd ? "text-red-500 font-bold" : "text-primary font-medium";
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
    const msPerPixel = (totalHours * 60 * 60 * 1000) / parentWidth;
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
        setSelectedSessionForInfo(session);
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
