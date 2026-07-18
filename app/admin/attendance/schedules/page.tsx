import { AttendanceWorkingHourService } from "@/modules/attendance/services/attendance-working-hour-service";
import { AttendanceWorkingHourTable } from "@/modules/attendance/components/attendance-working-hour-table";
import { PageHeader } from "@/components/page-header";
import { AttendanceWorkingHourDialog } from "@/modules/attendance/components/attendance-working-hour-dialog";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

interface AttendanceSchedulesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AttendanceSchedulesPage({ searchParams }: AttendanceSchedulesPageProps) {
  const params = await searchParams;
  const page = typeof params.page === 'string' ? Number(params.page) : 1;
  const limit = typeof params.limit === 'string' ? Number(params.limit) : 10;
  const search = typeof params.search === 'string' ? params.search : undefined;

  const data = await AttendanceWorkingHourService.getAllPaginated({ page, limit, search });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Jadwal Kehadiran (Schedules)"
        description="Tetapkan jadwal shift (jam kerja) untuk karyawan."
      >
        <AttendanceWorkingHourDialog />
      </PageHeader>

      <div className="w-full space-y-6">
        <AttendanceWorkingHourTable
          data={data.schedules}
        />
        <DataTablePagination metadata={data.metadata} />
      </div>
    </div>
  );
}
