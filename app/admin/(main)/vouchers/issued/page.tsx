import { PageHeader } from "@/components/page-header"
import { CustomerVoucherService } from "@/modules/vouchers/services/customer-voucher-service"
import { CustomerVoucherList } from "@/modules/vouchers/components/customer-vouchers-list"
import { CustomerVoucherFilters } from "@/modules/vouchers/components/customer-voucher-filters"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { ProductService } from "@/modules/product/services/product-service"

export const metadata = {
  title: "Voucher Terbit | Admin",
}

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    type?: string;
    productId?: string;
  }>;
}

export default async function IssuedVouchersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  const page = Number(params.page || "1")
  const limit = Number(params.limit || "10")
  
  const [result, rawProducts] = await Promise.all([
    CustomerVoucherService.getPaginated({
      page,
      limit,
      status: params.status,
      type: params.type,
      productId: params.productId
    }),
    ProductService.getAllProducts({ limit: 1000 })
  ])

  const products = rawProducts.products.map((p: any) => ({ id: p.id, name: p.name }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Daftar Voucher"
        description="Lihat semua voucher yang telah diberikan kepada pelanggan beserta statusnya."
      />

      <CustomerVoucherFilters products={products} />

      <div className="bg-card border rounded-lg overflow-hidden">
        <CustomerVoucherList data={result.data as any} />
        <DataTablePagination metadata={result.metadata} />
      </div>
    </div>
  )
}
