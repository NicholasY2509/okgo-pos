import { prisma } from "@/lib/prisma";
import { WorkingHourTable } from "@/modules/attendance/components/working-hour-table";
import { PageHeader } from "@/components/page-header";
import { WorkingHourDialog } from "@/modules/attendance/components/working-hour-dialog";

export default async function WorkingHoursMasterPage() {
  const workingHours = await prisma.workingHour.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Master Jam Kerja"
        description="Kelola template jam kerja (shift) yang tersedia."
      >
        <WorkingHourDialog />
      </PageHeader>

      <div className="w-full space-y-6">
        <WorkingHourTable data={workingHours} />
      </div>
    </div>
  );
}
