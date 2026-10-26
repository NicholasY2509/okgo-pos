import { BranchService } from "@/modules/branch/services/branch-service";
import { notFound } from "next/navigation";
import { AttendanceWorkingHourForm } from "@/modules/attendance/components/attendance-working-hour-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TenantAttendancePageProps {
  params: Promise<{ tenant: string }>;
}

export default async function TenantAttendancePage({ params }: TenantAttendancePageProps) {
  const { tenant } = await params;

  const branch = await BranchService.getBranchBySubdomain(tenant);
  if (!branch) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="-ml-2 h-8 w-8">
              <Link href="/hris">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <span>Jadwal Jam Kerja Karyawan</span>
          </div>
        }
        description={`Atur jadwal dan shift kerja karyawan cabang ${branch.name}.`}
      />

      <div className="max-w-2xl">
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle>Penetapan Shift</CardTitle>
            <CardDescription>Pilih staf dan tetapkan jam kerja/shift operasional mereka.</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceWorkingHourForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
