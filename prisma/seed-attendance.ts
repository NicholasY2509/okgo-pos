import { prisma } from '../lib/prisma'

async function main() {
  console.log('🌱 Starting attendance seeder...')

  // 1. Get staffs
  const staffs = await prisma.staff.findMany()
  if (staffs.length === 0) {
    console.log('⚠️ No staffs found. Please run the main seeder first.')
    return
  }

  // 2. Get attendance statuses
  const statuses = await prisma.attendanceStatus.findMany()
  const hadirStatus = statuses.find(s => s.code === 'H')
  const terlambatStatus = statuses.find(s => s.code === 'T')
  const absenStatus = statuses.find(s => s.code === 'A')
  const izinStatus = statuses.find(s => s.code === 'I')

  if (!hadirStatus || !terlambatStatus || !absenStatus || !izinStatus) {
    console.log('⚠️ Missing some attendance statuses. Please run the main seeder first.')
    return
  }

  // 3. Define date range (e.g., past 7 days)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let createdCount = 0

  for (let i = 0; i < 7; i++) {
    const attendanceDate = new Date(today)
    attendanceDate.setDate(today.getDate() - i)

    for (const staff of staffs) {
      // Check if attendance already exists
      const existing = await prisma.attendance.findUnique({
        where: {
          staffId_attendanceDate: {
            staffId: staff.id,
            attendanceDate: attendanceDate
          }
        }
      })

      if (existing) continue

      // Randomize attendance status
      // 70% Hadir, 10% Terlambat, 10% Izin, 10% Absen
      const rand = Math.random()
      let statusId = hadirStatus.id
      let clockIn: Date | null = new Date(attendanceDate)
      let clockOut: Date | null = new Date(attendanceDate)
      let notes = ''

      if (rand < 0.7) {
        // Hadir (On time) -> ~ 07:45 - 08:00
        statusId = hadirStatus.id
        clockIn.setHours(7, Math.floor(Math.random() * 16) + 45, 0, 0)
        clockOut.setHours(17, Math.floor(Math.random() * 30), 0, 0)
      } else if (rand < 0.8) {
        // Terlambat -> ~ 08:05 - 09:00
        statusId = terlambatStatus.id
        clockIn.setHours(8, Math.floor(Math.random() * 55) + 5, 0, 0)
        clockOut.setHours(17, Math.floor(Math.random() * 30), 0, 0)
      } else if (rand < 0.9) {
        // Izin
        statusId = izinStatus.id
        clockIn = null
        clockOut = null
        notes = 'Izin urusan keluarga'
      } else {
        // Absen
        statusId = absenStatus.id
        clockIn = null
        clockOut = null
      }

      await prisma.attendance.create({
        data: {
          staffId: staff.id,
          attendanceDate: attendanceDate,
          clockIn: clockIn,
          clockOut: clockOut,
          statusId: statusId,
          notes: notes,
          isManualOverride: false
        }
      })
      createdCount++
    }
  }

  console.log(`✅ Successfully seeded ${createdCount} mock attendance records for the past 7 days.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
