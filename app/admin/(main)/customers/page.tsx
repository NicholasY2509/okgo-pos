import { CustomerService } from "@/modules/customer/services/customer-service";
import { CustomerList } from "@/modules/customer/components/customer-list";
import { PageHeader } from "@/components/page-header";
import { CustomerFilters } from "@/modules/customer/components/customer-filters";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export const metadata = {
  title: "Customers | Admin",
};

interface CustomersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;
  const page = typeof params.page === 'string' ? Number(params.page) : 1;
  const limit = typeof params.limit === 'string' ? Number(params.limit) : 10;
  const search = typeof params.search === 'string' ? params.search : undefined;

  const { data: customers, metadata: paginationMetadata } = await CustomerService.searchCustomers(search, page, limit);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pelanggan"
        description="Lihat daftar pelanggan Anda."
      />
      <div className="space-y-4">
        <CustomerFilters />
        <CustomerList data={customers} />
        <DataTablePagination metadata={paginationMetadata} />
      </div>
    </div>
  );
}
