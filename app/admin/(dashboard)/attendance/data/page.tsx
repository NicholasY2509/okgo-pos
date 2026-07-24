import { AttendanceDataTable } from "@/modules/attendance/components/attendance-data-table";
import { PageHeader } from "@/components/page-header";

export default async function AttendanceDataPage() {
  // Placeholder dummy data
  const dummyData = [
    { id: "1", staffName: "Alice Smith", date: new Date(), status: "Present" as const, clockInTime: "08:00", clockOutTime: "17:05" },
    { id: "2", staffName: "Bob Jones", date: new Date(), status: "Late" as const, clockInTime: "08:45", clockOutTime: "17:00" },
    { id: "3", staffName: "Charlie Brown", date: new Date(), status: "Absent" as const, clockInTime: null, clockOutTime: null },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Data Kehadiran"
        description="Rekapitulasi data kehadiran dan absensi karyawan."
      />

      <div className="w-full space-y-6">
        <AttendanceDataTable data={dummyData} />
      </div>
    </div>
  );
}
