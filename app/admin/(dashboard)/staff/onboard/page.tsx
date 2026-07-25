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
    <div className="">
      <div className="mb-8">
        <PageHeader
          title="Onboard Staff Member"
          description="Create a new staff member, assign them to a branch, and optionally create a login account."
        />
      </div>

      <StaffOnboardingForm
        branches={branches}
        roles={roles}
        workPositions={workPositions}
      />
    </div>
  );
}
