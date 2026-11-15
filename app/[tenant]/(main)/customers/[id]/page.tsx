import { notFound } from "next/navigation";
import { BranchService } from "@/modules/branch/services/branch-service";
import { CustomerService } from "@/modules/customer/services/customer-service";
import { TenantCustomerDetail } from "@/modules/customer/components/tenant-customer-detail";

export const dynamic = "force-dynamic";

export default async function TenantCustomerDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant, id } = await params;
  const branch = await BranchService.getBranchBySubdomain(tenant);

  if (!branch) {
    notFound();
  }

  const detail = await CustomerService.getDetailWithActivity(id);

  if (!detail) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto w-full">
      <TenantCustomerDetail data={detail} />
    </div>
  );
}
