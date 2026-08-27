import { prisma } from "@/lib/prisma"
import { addDays, eachDayOfInterval, startOfDay } from "date-fns"

export class AttendanceCalculationService {
  /**
   * Menghitung status kehadiran untuk satu staf pada rentang tanggal tertentu.
   */
  static async calculate(startDate: Date, endDate: Date) {
    // 1. Fetch data yang dibutuhkan
    const start = startOfDay(startDate)
    const end = startOfDay(endDate)
    const days = eachDayOfInterval({ start, end })

    const staffs = await prisma.staff.findMany({ select: { id: true } })

    // Cache status codes
    let statuses = await prisma.attendanceStatus.findMany()
    const getStatusId = (code: string) => statuses.find(s => s.code === code)?.id || null

    // Pastikan status Lembur ada
    let statusOvertime = getStatusId("L")
    if (!statusOvertime) {
      const newStatus = await prisma.attendanceStatus.create({
        data: { code: "L", name: "Lembur" }
      })
      statuses.push(newStatus)
      statusOvertime = newStatus.id
    }

    const statusPresent = getStatusId("PRESENT") || getStatusId("H")
    const statusLate = getStatusId("LATE") || getStatusId("T")
    const statusAbsent = getStatusId("ABSENT") || getStatusId("A")
    const statusOff = getStatusId("OFF") || getStatusId("O")

    let calculatedCount = 0

    // Fetch batch data untuk semua staff dalam rentang tanggal
    const schedules = await prisma.attendanceWorkingHour.findMany({
      where: {
        attendanceDate: { gte: start, lte: end }
      },
      include: { workingHour: true }
    })

    const attendances = await prisma.attendance.findMany({
      where: {
        attendanceDate: { gte: start, lte: end }
      }
    })

    for (const staff of staffs) {
      const staffId = staff.id
      const staffSchedules = schedules.filter(s => s.staffId === staffId)
      const staffAttendances = attendances.filter(a => a.staffId === staffId)

      // 2. Evaluasi setiap hari dalam rentang tanggal
      for (const day of days) {
        const schedule = staffSchedules.find(s => s.attendanceDate.getTime() === day.getTime())
        const attendance = staffAttendances.find(a => a.attendanceDate.getTime() === day.getTime())

        let newStatusId: string | null = null

        if (!schedule) {
          // Tidak ada jadwal -> Libur (OFF)
          newStatusId = statusOff
        } else {
          // Ada jadwal
          if (!attendance || (!attendance.clockIn && !attendance.clockOut)) {
            // Tidak clock in / clock out -> Mangkir (ABSENT)
            newStatusId = statusAbsent
          } else if (attendance.clockIn) {
            const getHHMM = (d: Date) => {
              const pad = (n: number) => n.toString().padStart(2, "0")
              return `${pad(d.getHours())}:${pad(d.getMinutes())}`
            }

            let isOvertime = false;
            if (attendance.clockOut) {
              const clockOutHHMM = getHHMM(attendance.clockOut)

              const toMinutes = (timeStr: string) => {
                const [h, m] = timeStr.split(':').map(Number);
                return (h * 60) + m;
              };

              if (toMinutes(clockOutHHMM) >= toMinutes(schedule.workingHour.clockOut) + 15) {
                isOvertime = true;
              }
            }

            const punchHHMM = getHHMM(attendance.clockIn)

            if (isOvertime) {
              newStatusId = statusOvertime
            } else if (punchHHMM > schedule.workingHour.clockIn) {
              newStatusId = statusLate
            } else {
              newStatusId = statusPresent
            }
          } else {
            // Kondisi aneh: ada clockOut tapi tidak ada clockIn, 
            // untuk simplifikasi kita anggap PRESENT sementara
            newStatusId = statusPresent
          }
        }

        if (newStatusId) {
          if (attendance) {
            // Update status jika berbeda dan tidak dioverride manual
            if (attendance.statusId !== newStatusId && !attendance.isManualOverride) {
              await prisma.attendance.update({
                where: { id: attendance.id },
                data: { statusId: newStatusId }
              })
              calculatedCount++
            }
          } else {
            // Jika belum ada record attendance sama sekali, dan dia absent/off, buat row baru
            await prisma.attendance.create({
              data: {
                staffId,
                attendanceDate: day,
                statusId: newStatusId,
                attendanceWorkingHourId: schedule ? schedule.id : undefined,
              }
            })
            calculatedCount++
          }
        }
      }
    }

    return { success: true, calculatedCount }
  }
}
