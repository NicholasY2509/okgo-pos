import { StaffIncentiveClient } from "@/modules/staff-incentive/components/staff-incentive-client";

export const dynamic = 'force-dynamic';

export default async function AdminIncentivesPage() {
  return (
    <div className="max-w-7xl mx-auto w-full">
      <StaffIncentiveClient />
    </div>
  );
}
