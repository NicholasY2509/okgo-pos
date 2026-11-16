import { describe, expect, it } from "vitest"
import { sortStaffByShiftAndArrival } from "./staff-shift-sort"

function makeJakartaTime(timeStr: string): Date {
  return new Date(`2026-11-15T${timeStr}:00+07:00`)
}

describe("sortStaffByShiftAndArrival", () => {
  const shift08 = { clockIn: "08:00", clockOut: "16:00" }
  const shift12 = { clockIn: "12:00", clockOut: "20:00" }

  it("prioritizes shift 12:00 over shift 08:00 at 12:30, even if shift 08:00 arrived at 07:00", () => {
    const staffA = {
      name: "A (Shift 08, datang 07:00)",
      attendances: [
        {
          clockIn: makeJakartaTime("07:00"),
          attendanceWorkingHour: { workingHour: shift08 },
        },
      ],
    }
    const staffB = {
      name: "B (Shift 12, datang 11:00)",
      attendances: [
        {
          clockIn: makeJakartaTime("11:00"),
          attendanceWorkingHour: { workingHour: shift12 },
        },
      ],
    }
    const staffC = {
      name: "C (Shift 12, datang 11:30)",
      attendances: [
        {
          clockIn: makeJakartaTime("11:30"),
          attendanceWorkingHour: { workingHour: shift12 },
        },
      ],
    }

    const sorted = sortStaffByShiftAndArrival(
      [staffA, staffC, staffB],
      makeJakartaTime("12:30")
    )

    expect(sorted.map((s) => s.name)).toEqual([
      "B (Shift 12, datang 11:00)",
      "C (Shift 12, datang 11:30)",
      "A (Shift 08, datang 07:00)",
    ])
  })

  it("prioritizes active shift 08:00 over upcoming shift 12:00 at 09:00", () => {
    const staffA = {
      name: "A (Shift 08, datang 07:30)",
      attendances: [
        {
          clockIn: makeJakartaTime("07:30"),
          attendanceWorkingHour: { workingHour: shift08 },
        },
      ],
    }
    const staffB = {
      name: "B (Shift 12, datang 08:00)",
      attendances: [
        {
          clockIn: makeJakartaTime("08:00"),
          attendanceWorkingHour: { workingHour: shift12 },
        },
      ],
    }

    const sorted = sortStaffByShiftAndArrival(
      [staffB, staffA],
      makeJakartaTime("09:00")
    )

    expect(sorted.map((s) => s.name)).toEqual([
      "A (Shift 08, datang 07:30)",
      "B (Shift 12, datang 08:00)",
    ])
  })

  it("falls back to earliest clockIn when no shift is assigned", () => {
    const staffEarly = {
      name: "Early",
      attendances: [{ clockIn: makeJakartaTime("07:00") }],
    }
    const staffLate = {
      name: "Late",
      attendances: [{ clockIn: makeJakartaTime("08:30") }],
    }
    const staffNoClockIn = {
      name: "NoClockIn",
      attendances: [],
    }

    const sorted = sortStaffByShiftAndArrival(
      [staffNoClockIn, staffLate, staffEarly],
      makeJakartaTime("10:00")
    )

    expect(sorted.map((s) => s.name)).toEqual(["Early", "Late", "NoClockIn"])
  })
})
