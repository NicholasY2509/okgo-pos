import { AttendanceRepository, GetAttendancesParams } from "../repositories/attendance-repository"
import { AttendanceInput } from "../schemas/attendance"
import { prisma } from "@/lib/prisma"

export class AttendanceService {
  static async processPunch(staffId: string, punchTime: Date, punchType: string, machineId: string) {
    let attendance = await AttendanceRepository.findByStaffAndDate(staffId, punchTime)

    // Normalisasikan punchTime ke Date biasa untuk pencarian startOfDay
    const normalizedDate = new Date(punchTime)
    normalizedDate.setUTCHours(0, 0, 0, 0)
    const endOfDay = new Date(normalizedDate)
    endOfDay.setUTCDate(normalizedDate.getUTCDate() + 1)

    // Cari jadwal kerja (AttendanceWorkingHour) untuk tanggal tersebut
    const schedule = await prisma.attendanceWorkingHour.findFirst({
      where: {
        staffId,
        attendanceDate: {
          gte: normalizedDate,
          lt: endOfDay
        }
      },
      include: {
        workingHour: true
      }
    })

    if (!attendance) {
      attendance = await AttendanceRepository.create({
        staffId,
        attendanceDate: normalizedDate,
        attendanceWorkingHourId: schedule?.id || null
      })
    }

    const updates: Partial<AttendanceInput> = {}

    // Helper untuk memformat UTC time ke "HH:mm" agar bisa dibandingan dengan string "HH:mm"
    const getHHMM = (d: Date) => {
      return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`
    }

    if (punchType === "1" || punchType === "0" || !attendance.clockIn) {
      // Masuk
      updates.clockIn = punchTime
      updates.clockInMachineId = machineId

      // Tentukan status
      let statusStr = "H" // Default Hadir

      if (schedule && schedule.workingHour) {
        const punchHHMM = getHHMM(punchTime)
        // Bandingkan "08:15" > "08:00" = Terlambat
        if (punchHHMM > schedule.workingHour.clockIn) {
          statusStr = "T" // Terlambat
        }
      }

      // Ambil ID dari status string tersebut
      const statusObj = await prisma.attendanceStatus.findUnique({ where: { code: statusStr } })
      if (statusObj) {
        updates.statusId = statusObj.id
      }
    } else if (punchType === "4" || punchType === "1") {
      // Pulang
      updates.clockOut = punchTime
      updates.clockOutMachineId = machineId

      // Saat absen pulang, status tidak perlu diubah, biarkan yang sudah ditetapkan (Hadir/Terlambat/dsb)
    }

    if (Object.keys(updates).length > 0) {
      await AttendanceRepository.update(attendance.id, updates)
    }

    return attendance
  }

  static async getAttendances(params: GetAttendancesParams) {
    return await AttendanceRepository.getAttendances(params)
  }

  static async updateStatus(attendanceId: string, statusId: string) {
    return await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        statusId: statusId,
        isManualOverride: true,
      }
    })
  }
}
