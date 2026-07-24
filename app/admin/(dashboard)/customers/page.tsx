import { CustomerService } from "@/modules/customer/services/customer-service";
import { CustomerList } from "@/modules/customer/components/customer-list";

export const metadata = {
  title: "Customers | Admin",
};

export default async function CustomersPage() {
  const customers = await CustomerService.getAll();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <CustomerList data={customers} />
    </div>
  );
}
