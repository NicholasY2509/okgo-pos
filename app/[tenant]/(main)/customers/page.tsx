import { notFound } from "next/navigation";
import { BranchService } from "@/modules/branch/services/branch-service";
import { CustomerService } from "@/modules/customer/services/customer-service";
import { TenantCustomerDirectory } from "@/modules/customer/components/tenant-customer-directory";

export const dynamic = "force-dynamic";

export default async function TenantCustomersPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const branch = await BranchService.getBranchBySubdomain(tenant);

  if (!branch) {
    notFound();
  }

  const directory = await CustomerService.getDirectory("", 1, 20);

  return (
    <div className="max-w-7xl mx-auto w-full">
      <TenantCustomerDirectory
        initialCustomers={directory.data}
        initialTotal={directory.metadata.total}
      />
    </div>
  );
}
