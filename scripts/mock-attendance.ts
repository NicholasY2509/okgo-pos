import { prisma } from "../lib/prisma"

async function main() {
  const staffId = process.argv[2]

  if (!staffId) {
    console.log("Please provide a staff ID. Usage: npx tsx scripts/mock-attendance.ts <staff-id>")
    const firstStaff = await prisma.staff.findFirst()
    if (firstStaff) {
      console.log(`Hint: you can use this staff ID: ${firstStaff.id} (${firstStaff.firstName} ${firstStaff.lastName})`)
    }
    return
  }

  const staff = await prisma.staff.findUnique({ where: { id: staffId } })
  if (!staff) {
    console.log("Staff not found.")
    return
  }

  console.log(`Generating mock attendance for ${staff.firstName} ${staff.lastName} (August 2026)`)

  // Use the system's original status codes instead of creating new ones
  const statusesData = [
    { code: "H", name: "Hadir", isPenaltyApplicable: false },
    { code: "T", name: "Terlambat", isPenaltyApplicable: true, penaltyType: "FIXED", penaltyAmount: 15000 },
    { code: "A", name: "Absen", isPenaltyApplicable: true, penaltyType: "FIXED", penaltyAmount: 50000 },
  ]

  const statuses: Record<string, string> = {}

  for (const s of statusesData) {
    const existing = await prisma.attendanceStatus.upsert({
      where: { code: s.code },
      update: {},
      create: s
    })
    statuses[s.code] = existing.id
  }

  // Clear existing attendance for July and August 2026 for this staff
  const startDate = new Date("2026-07-01T00:00:00Z")
  const endDate = new Date("2026-08-31T23:59:59Z")

  await prisma.attendance.deleteMany({
    where: {
      staffId,
      attendanceDate: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  // Generate July and August (62 days)
  const attendances = []

  let currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const day = currentDate.getUTCDate()
    const month = currentDate.getUTCMonth() // 6 = July, 7 = Aug

    let statusCode = "H"
    let overtime = 0

    // Break perfect week/month on the 15th of each month
    if (day === 15) {
      statusCode = "A"
    }
    // Late on the 26th of each month (but still counts for perfect week in our logic)
    else if (day === 26) {
      statusCode = "T"
    }

    // Add some overtime
    if ([5, 12, 20].includes(day)) {
      overtime = 2 // 2 hours overtime
    }

    // Local time in UTC+7 (WIB):
    // 08:00 WIB = 01:00 UTC
    // 17:00 WIB = 10:00 UTC
    const WIB_OFFSET = 7 * 3600000;

    attendances.push({
      staffId,
      attendanceDate: new Date(currentDate),
      clockIn: new Date(currentDate.getTime() + (8 * 3600000) - WIB_OFFSET + (statusCode === "T" ? 1800000 : 0)), // 08:00 or 08:30 WIB
      clockOut: new Date(currentDate.getTime() + (17 * 3600000) - WIB_OFFSET + (overtime * 3600000)), // 17:00 or later WIB
      statusId: statuses[statusCode],
      overtimeHours: overtime,
      isManualOverride: false,
    })

    currentDate.setUTCDate(currentDate.getUTCDate() + 1)
  }

  await prisma.attendance.createMany({
    data: attendances
  })

  console.log(`Successfully generated 62 days of attendance data for July & August 2026!`)
  console.log("- Includes data spanning custom payroll periods (e.g. July 26 - Aug 25)")
  console.log("- ABSENT on the 15th of each month")
  console.log("- LATE on the 26th of each month")
  console.log("- Overtime (2 hours) on the 5th, 12th, and 20th of each month")
}

main().catch(console.error)
