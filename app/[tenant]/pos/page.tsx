import { PosClient } from "@/modules/pos/components/pos-client";
import { PosDataService } from "@/modules/pos/services/pos-data-service";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function POSPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;

  const data = await PosDataService.getInitialData(tenant);

  if (!data) {
    notFound();
  }

  return (
    <PosClient
      branchId={data.branch.id}
      tenant={tenant}
      products={data.products}
      voucherPackets={data.voucherPackets}
      staff={data.staff}
      rooms={data.rooms}
      paymentMethods={data.paymentMethods}
      customers={data.customers}
      activeDiscount={data.activeDiscount}
    />
  );
}
