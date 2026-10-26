import { TransactionHistoryClient } from "@/modules/pos/components/transaction-history-client";
import { BranchRepository } from "@/modules/branch/repositories/branch-repository";

export const dynamic = 'force-dynamic';

export default async function AdminTransactionsPage() {
  const branches = await BranchRepository.getAllBranches();

  return (
    <div className="max-w-7xl mx-auto w-full">
      <TransactionHistoryClient branches={branches} isAdmin={true} />
    </div>
  );
}
