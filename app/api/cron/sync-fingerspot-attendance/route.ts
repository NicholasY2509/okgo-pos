import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { FingerspotService } from "@/modules/fingerspot/services/fingerspot-service"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const machines = await prisma.attendanceMachine.findMany({
      where: { isActive: true },
    })

    if (machines.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Tidak ada mesin absensi yang aktif.",
        totalImported: 0,
        totalSkipped: 0,
      })
    }

    // Rentang 2 hari (Kemarin s.d. Hari Ini) sesuai batasan Fingerspot API
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const startDate = yesterday.toISOString().slice(0, 10)
    const endDate = today.toISOString().slice(0, 10)

    let totalImported = 0
    let totalSkipped = 0
    const results: Array<{ sn: string; name: string; imported: number; skipped: number }> = []

    for (const machine of machines) {
      try {
        const result = await FingerspotService.getAttlog({
          cloudId: machine.sn,
          startDate,
          endDate,
          importToDatabase: true,
        })

        totalImported += result.importedCount
        totalSkipped += result.skippedCount

        results.push({
          sn: machine.sn,
          name: machine.name,
          imported: result.importedCount,
          skipped: result.skippedCount,
        })
      } catch (machineError) {
        console.error(`Gagal sync cron untuk mesin ${machine.sn}:`, machineError)
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      dateRange: { startDate, endDate },
      machinesProcessed: machines.length,
      totalImported,
      totalSkipped,
      details: results,
    })
  } catch (error) {
    console.error("Error in sync-fingerspot-attendance cron:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    )
  }
}
