import { StaffIncentiveClient } from "@/modules/staff-incentive/components/staff-incentive-client";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function AdminIncentivesPage() {
  const workPositions = await prisma.workPosition.findMany({
    orderBy: { name: "asc" }
  });

  const incentiveRules = await prisma.incentiveRule.findMany({
    include: {
      tiers: {
        orderBy: { minTarget: "asc" }
      },
      targetWorkPositions: true,
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="flex flex-col gap-6">
      <StaffIncentiveClient
        workPositions={JSON.parse(JSON.stringify(workPositions))}
        initialRules={JSON.parse(JSON.stringify(incentiveRules))}
      />
    </div>
  );
}
