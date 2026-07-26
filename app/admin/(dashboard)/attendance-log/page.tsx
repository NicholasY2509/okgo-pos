import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/page-header"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Log Absensi Mesin | OKGO POS",
  description: "Riwayat raw log absensi dari mesin sidik jari/wajah.",
}

export default async function AttendanceLogPage() {
  const logs = await prisma.attendanceMachineLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100, // Ambil 100 log terbaru agar tidak berat
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Log Absensi Mesin"
        description="Melihat riwayat mentah (raw logs) pengiriman absen dari mesin ke sistem."
      />

      <DataTable columns={columns} data={logs} emptyMessage="Belum ada log absensi yang masuk." />

    </div>
  )
}
