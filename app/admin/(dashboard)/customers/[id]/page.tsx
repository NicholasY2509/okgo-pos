import { CustomerService } from "@/modules/customer/services/customer-service";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { CustomerTransactionsTable } from "@/modules/customer/components/customer-transactions-table";
import { Phone, Mail, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Customer Details | Admin",
};

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CustomerDetailPage({ params, searchParams }: CustomerDetailPageProps) {
  const { id } = await params;
  const sParams = await searchParams;
  const page = typeof sParams.page === 'string' ? Number(sParams.page) : 1;
  const limit = typeof sParams.limit === 'string' ? Number(sParams.limit) : 10;

  const customer = await CustomerService.getById(id);

  if (!customer) {
    notFound();
  }

  const { data: transactions, metadata: paginationMetadata } = await CustomerService.getCustomerTransactions(id, page, limit);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Detail Pelanggan"
        description="Lihat informasi pelanggan, voucher, dan riwayat transaksi."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <User className="h-5 w-5" />
              {customer.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 shrink-0 text-gray-500" />
              <span>{customer.phone || "Tidak ada telepon"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 shrink-0 text-gray-500" />
              <span>{customer.email || "Tidak ada email"}</span>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="transactions">Riwayat Transaksi</TabsTrigger>
              <TabsTrigger value="vouchers">Voucher Aktif</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions" className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Transaksi</CardTitle>
                  <CardDescription>Daftar semua transaksi yang dilakukan oleh pelanggan ini.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CustomerTransactionsTable data={transactions} />
                  <DataTablePagination metadata={paginationMetadata} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="vouchers" className="space-y-4">
              {customer.vouchers.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Pelanggan ini tidak memiliki voucher aktif.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {customer.vouchers.map((v: any) => (
                    <Card key={v.id}>
                      <CardHeader className="pb-3 border-b">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{v.voucherPacket.name}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">Kode: {v.code}</p>
                          </div>
                          <Badge variant={v.status === "ACTIVE" ? "default" : "secondary"}>
                            {v.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-2 text-sm">
                        {v.remainingVisitCount != null && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sisa Kunjungan:</span>
                            <span className="font-medium">{v.remainingVisitCount} / {v.initialVisitCount}</span>
                          </div>
                        )}
                        {v.remainingCreditAmount != null && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sisa Saldo:</span>
                            <span className="font-medium">Rp {Number(v.remainingCreditAmount).toLocaleString()}</span>
                          </div>
                        )}
                        {v.expiresAt && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Kedaluwarsa:</span>
                            <span>{new Date(v.expiresAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
