import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TransactionHistoryClient } from "@/modules/pos/components/transaction-history-client";

export const dynamic = 'force-dynamic';

export default async function TransactionsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;

  const branch = await prisma.branch.findUnique({
    where: { subdomain: tenant }
  });

  if (!branch) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto w-full">
      <TransactionHistoryClient branchId={branch.id} />
    </div>
  );
}
