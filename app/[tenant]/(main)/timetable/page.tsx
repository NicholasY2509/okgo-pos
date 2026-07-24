import { TimetableClient } from "@/modules/pos/components/timetable-client";
import { notFound } from "next/navigation";
import { BranchService } from "@/modules/branch/services/branch-service";
import { RoomService } from "@/modules/room/services/room-service";
import { PaymentMethodService } from "@/modules/payment-method/services/payment-method-service";
import { StaffService } from "@/modules/staff/services/staff-service";

export const dynamic = 'force-dynamic';

export default async function TimetablePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;

  const branch = await BranchService.getBranchBySubdomain(tenant);

  if (!branch) {
    notFound();
  }

  const rooms = await RoomService.getActiveByBranchId(branch.id);
  const paymentMethods = await PaymentMethodService.getActive();
  const staff = await StaffService.getActiveStaff(branch.id);

  return (
    <TimetableClient
      branchId={branch.id}
      rooms={rooms}
      paymentMethods={paymentMethods}
      staff={staff}
    />
  );
}
