import { CustomerService } from "@/modules/customer/services/customer-service";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Customer Details | Admin",
};

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await CustomerService.getById(id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-2xl font-bold">Customer Profile</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Name:</strong> {customer.name}</p>
            <p><strong>Phone:</strong> {customer.phone || "-"}</p>
            <p><strong>Email:</strong> {customer.email || "-"}</p>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-xl font-bold mt-8 mb-4">Voucher Balances</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {customer.vouchers.length === 0 ? (
          <p className="text-gray-500">No vouchers found.</p>
        ) : (
          customer.vouchers.map((v: any) => (
            <Card key={v.id}>
              <CardHeader>
                <CardTitle className="text-lg">{v.voucherPacket.name}</CardTitle>
                <p className="text-sm text-gray-500">Code: {v.code}</p>
              </CardHeader>
              <CardContent>
                <p>Status: <span className="font-semibold">{v.status}</span></p>
                {v.remainingVisitCount != null && (
                  <p>Visits: {v.remainingVisitCount} / {v.initialVisitCount}</p>
                )}
                {v.remainingCreditAmount != null && (
                  <p>Credit: Rp {Number(v.remainingCreditAmount).toLocaleString()} / Rp {Number(v.initialCreditAmount).toLocaleString()}</p>
                )}
                {v.expiresAt && <p>Expires: {new Date(v.expiresAt).toLocaleDateString()}</p>}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <h3 className="text-xl font-bold mt-8 mb-4">Recent Transactions</h3>
      {customer.transactions.length === 0 ? (
        <p className="text-gray-500">No transactions found.</p>
      ) : (
        <div className="border rounded-md divide-y">
          {customer.transactions.map((tx: any) => (
            <div key={tx.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{tx.transactionNumber}</p>
                <p className="text-sm text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">Rp {Number(tx.totalAmount).toLocaleString()}</p>
                <p className="text-sm">{tx.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
