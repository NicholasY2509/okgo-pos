const JAKARTA_TIMEZONE = "Asia/Jakarta"

export interface StaffShiftSortInput {
  attendances?: Array<{
    clockIn?: string | Date | null
    attendanceWorkingHour?: {
      workingHour?: {
        clockIn: string
        clockOut: string
      } | null
    } | null
  }>
  attendanceWorkingHours?: Array<{
    workingHour?: {
      clockIn: string
      clockOut: string
    } | null
  }>
}

/**
 * Parses a "HH:MM" or "HHMM" time string into minutes since midnight.
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  const match = /^([01]\d|2[0-3]):?([0-5]\d)$/.exec(timeStr.trim())
  if (!match) return null
  return Number.parseInt(match[1], 10) * 60 + Number.parseInt(match[2], 10)
}

/**
 * Returns wall-clock minutes since midnight in Asia/Jakarta for a given Date.
 */
export function getJakartaMinutesOfDay(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: JAKARTA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date)

  const hour = Number.parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10)
  const minute = Number.parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10)
  return (hour % 24) * 60 + minute
}

interface StaffSortKey {
  tier: number
  shiftStartMin: number
  actualClockInMs: number
}

function getStaffSortKey(staff: StaffShiftSortInput, refMin: number): StaffSortKey {
  const att = staff.attendances?.[0]
  const actualClockInMs = att?.clockIn
    ? new Date(att.clockIn).getTime()
    : Number.POSITIVE_INFINITY

  const workingHour =
    att?.attendanceWorkingHour?.workingHour ??
    staff.attendanceWorkingHours?.[0]?.workingHour ??
    null

  if (!workingHour) {
    return {
      tier: Number.isFinite(actualClockInMs) ? 1 : 3,
      shiftStartMin: 0,
      actualClockInMs,
    }
  }

  const startMin = parseTimeToMinutes(workingHour.clockIn)
  const rawEndMin = parseTimeToMinutes(workingHour.clockOut)
  if (startMin === null || rawEndMin === null) {
    return {
      tier: Number.isFinite(actualClockInMs) ? 1 : 3,
      shiftStartMin: 0,
      actualClockInMs,
    }
  }

  // Handle overnight shifts where clockOut is on the next day
  const endMin = rawEndMin <= startMin ? rawEndMin + 1440 : rawEndMin
  const effectiveRefMin = rawEndMin <= startMin && refMin < startMin ? refMin + 1440 : refMin

  if (effectiveRefMin >= startMin && effectiveRefMin < endMin) {
    // Tier 0: Active shift at referenceTime (newest/most recently started shift first)
    return { tier: 0, shiftStartMin: startMin, actualClockInMs }
  }

  if (effectiveRefMin < startMin) {
    // Tier 2: Upcoming shift (soonest shift first)
    return { tier: 2, shiftStartMin: startMin, actualClockInMs }
  }

  // Tier 3: Shift has already ended
  return { tier: 3, shiftStartMin: startMin, actualClockInMs }
}

/**
 * Sorts staff by active shift at `referenceTime` (most recently started shift first),
 * then by earliest attendance `clockIn` within the same shift.
 */
export function sortStaffByShiftAndArrival<T extends StaffShiftSortInput>(
  staffList: T[],
  referenceTime: Date = new Date()
): T[] {
  const refMin = getJakartaMinutesOfDay(referenceTime)

  return [...staffList].sort((a, b) => {
    const keyA = getStaffSortKey(a, refMin)
    const keyB = getStaffSortKey(b, refMin)

    if (keyA.tier !== keyB.tier) {
      return keyA.tier - keyB.tier
    }

    if (keyA.tier === 0 && keyA.shiftStartMin !== keyB.shiftStartMin) {
      // Active shifts: prioritize the shift that started most recently (e.g. 12:00 before 08:00)
      return keyB.shiftStartMin - keyA.shiftStartMin
    }

    if (keyA.tier === 2 && keyA.shiftStartMin !== keyB.shiftStartMin) {
      // Upcoming shifts: soonest shift first
      return keyA.shiftStartMin - keyB.shiftStartMin
    }

    return keyA.actualClockInMs - keyB.actualClockInMs
  })
}
