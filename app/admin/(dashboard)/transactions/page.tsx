import { TransactionHistoryClient } from "@/modules/pos/components/transaction-history-client";

export const dynamic = 'force-dynamic';

export default async function AdminTransactionsPage() {
  return (
    <div className="max-w-7xl mx-auto w-full">
      <TransactionHistoryClient />
    </div>
  );
}
