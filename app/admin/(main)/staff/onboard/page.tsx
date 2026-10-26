import { prisma } from "@/lib/prisma";
import { StaffOnboardingForm } from "@/modules/staff/components/staff-onboarding-form";
import { PageHeader } from "@/components/page-header";

export default async function OnboardStaffPage() {
  const [branches, roles, workPositions] = await Promise.all([
    prisma.branch.findMany({ select: { id: true, name: true } }),
    prisma.role.findMany({ select: { id: true, name: true } }),
    prisma.workPosition.findMany({ select: { id: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Onboard Staf Baru"
        description="Daftarkan anggota staf baru, tentukan posisi, tugaskan ke cabang, dan buat akun login sistem."
        backHref="/admin/staff"
        backLabel="Kembali ke Manajemen Staf"
      />

      <StaffOnboardingForm
        branches={branches}
        roles={roles}
        workPositions={workPositions}
      />
    </div>
  );
}
