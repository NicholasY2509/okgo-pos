import { prisma } from "@/lib/prisma";
import { AttendanceWorkingHourForm } from "@/modules/attendance/components/attendance-working-hour-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TenantAttendancePageProps {
  params: Promise<{ tenant: string }>;
}

export default async function TenantAttendancePage({ params }: TenantAttendancePageProps) {
  const { tenant } = await params;

  // For tenant page, we would normally filter staff by branch. 
  // We look up the branch by slug (tenant)
  const branch = await prisma.branch.findUnique({
    where: { subdomain: tenant },
  });

  if (!branch) {
    return <div className="p-6">Branch not found</div>;
  }



  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Schedules</h1>
        <p className="text-muted-foreground">
          Assign working hours to staff in your branch.
        </p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Assign Schedules</CardTitle>
            <CardDescription>Select staff members and assign their shifts.</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceWorkingHourForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
