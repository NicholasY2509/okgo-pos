import { AttendanceRepository, GetAttendancesParams } from "../repositories/attendance-repository"
import { AttendanceInput } from "../schemas/attendance"
import { prisma } from "@/lib/prisma"

export class AttendanceService {
  static async processPunch(staffId: string, punchTime: Date, punchType?: string, machineId?: string) {
    let attendance = await AttendanceRepository.findByStaffAndDate(staffId, punchTime)

    // Normalisasikan punchTime ke Date awal hari (UTC) agar konsisten dengan attendanceDate
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

    // Helper untuk memformat waktu ke "HH:mm" berbasis timezone Asia/Jakarta (WIB)
    const getHHMM = (d: Date) => {
      try {
        const parts = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).formatToParts(d)
        const hour = parts.find(p => p.type === "hour")?.value || "00"
        const minute = parts.find(p => p.type === "minute")?.value || "00"
        return `${hour}:${minute}`
      } catch {
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      }
    }

    // 1. Belum ada Clock-In sama sekali -> PUNCH PERTAMA = CLOCK IN
    if (!attendance.clockIn) {
      updates.clockIn = punchTime
      if (machineId) updates.clockInMachineId = machineId

      // Tentukan status kehadiran (Hadir vs Terlambat)
      let statusStr = "H" // Default Hadir

      if (schedule && schedule.workingHour?.clockIn) {
        const punchHHMM = getHHMM(punchTime)
        // Bandingkan "08:15" > "08:00" = Terlambat
        if (punchHHMM > schedule.workingHour.clockIn) {
          statusStr = "T" // Terlambat
        }
      }

      // Ambil ID dari master status (mendukung kode H/PRESENT dan T/LATE)
      const statusObj = await prisma.attendanceStatus.findFirst({
        where: {
          OR: [
            { code: statusStr },
            { code: statusStr === "H" ? "PRESENT" : "LATE" }
          ]
        }
      })
      if (statusObj) {
        updates.statusId = statusObj.id
      }
    }
    // 2. Clock-In sudah ada -> PUNCH BERIKUTNYA = CLOCK OUT
    else {
      const existingClockInTime = new Date(attendance.clockIn).getTime()
      const currentPunchTime = new Date(punchTime).getTime()
      const diffMinutes = (currentPunchTime - existingClockInTime) / (1000 * 60)

      // Hanya proses sebagai clock-out jika berselisih minimal 2 menit dari clock-in (mencegah accidental double scan)
      if (diffMinutes >= 2) {
        // Jika belum ada clockOut, atau punch baru terjadi lebih lambat dari clockOut lama -> perbarui ke waktu pulang terbaru
        if (!attendance.clockOut || currentPunchTime >= new Date(attendance.clockOut).getTime()) {
          updates.clockOut = punchTime
          if (machineId) updates.clockOutMachineId = machineId
        }
      } else if (currentPunchTime < existingClockInTime) {
        // Jika log yang masuk ternyata lebih awal dari clockIn yang tercatat sebelumnya
        updates.clockIn = punchTime
        if (!attendance.clockOut) {
          updates.clockOut = attendance.clockIn
          if (attendance.clockInMachineId) updates.clockOutMachineId = attendance.clockInMachineId
        }
        if (machineId) updates.clockInMachineId = machineId
      }
    }

    if (Object.keys(updates).length > 0) {
      attendance = await AttendanceRepository.update(attendance.id, updates)
    }

    return attendance
  }

  static async getAttendances(params: GetAttendancesParams) {
    return await AttendanceRepository.getAttendances(params)
  }

  static async updateStatus(attendanceId: string, statusId: string, attachmentUrl?: string) {
    return await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        statusId: statusId,
        isManualOverride: true,
        attachmentUrl: attachmentUrl || null,
      }
    })
  }
}
