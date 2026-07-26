import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  // Verifikasi token rahasia untuk membatasi akses (Optional tapi disarankan)
  const authHeader = req.headers.get("authorization")

  // Jika menggunakan Vercel Cron, biasanya ada header khusus atau kita bisa menggunakan env variable rahasia.
  // Untuk saat ini kita biarkan terbuka, tapi di produksi harus dilindungi.
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 1. Ambil status TIDAK_ABSEN_PULANG dari master status
    const tapStatus = await prisma.attendanceStatus.findUnique({
      where: { code: 'TAP' }
    })

    if (!tapStatus) {
      return NextResponse.json({ success: false, error: "Status TAP tidak ditemukan di master" }, { status: 400 })
    }

    // 2. Tentukan range hari ini
    // Cron biasanya berjalan jam 23:55 atau 23:59.
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const endOfDay = new Date(today)
    endOfDay.setUTCDate(today.getUTCDate() + 1)

    // 3. Cari semua absensi HARI INI yang punya clockIn tapi TIDAK punya clockOut
    const uncompletedAttendances = await prisma.attendance.findMany({
      where: {
        attendanceDate: {
          gte: today,
          lt: endOfDay
        },
        clockIn: { not: null },
        clockOut: null
      }
    })

    if (uncompletedAttendances.length === 0) {
      return NextResponse.json({ success: true, message: "Tidak ada absensi menggantung hari ini." })
    }

    // 4. Update semuanya menjadi status TAP
    const result = await prisma.attendance.updateMany({
      where: {
        id: { in: uncompletedAttendances.map(a => a.id) }
      },
      data: {
        statusId: tapStatus.id
      }
    })

    return NextResponse.json({
      success: true,
      message: `Berhasil mengevaluasi absensi. ${result.count} data diubah menjadi TIDAK ABSEN PULANG.`
    })
  } catch (error: any) {
    console.error("Cron Job Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
