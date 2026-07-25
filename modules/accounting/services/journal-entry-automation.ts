import { JournalEntryInput } from "../schemas/journal-entry"

export class JournalEntryAutomation {
  static async handleTransactionCompleted(tx: any, transaction: any) {
    if (transaction.status !== "COMPLETED") return;

    // 1. Ensure Default Accounts Exist (This is a simplified approach)
    let cashAccount = await tx.ledgerAccount.findFirst({ where: { code: '1100' } });
    if (!cashAccount) {
      cashAccount = await tx.ledgerAccount.create({
        data: { code: '1100', name: 'Cash', type: 'ASSET', tenantId: transaction.tenantId }
      });
    }

    let salesAccount = await tx.ledgerAccount.findFirst({ where: { code: '4100' } });
    if (!salesAccount) {
      salesAccount = await tx.ledgerAccount.create({
        data: { code: '4100', name: 'Sales Revenue', type: 'REVENUE', tenantId: transaction.tenantId }
      });
    }

    // Debit Cash, Credit Sales
    const amount = Number(transaction.totalAmount);

    if (amount > 0) {
      await tx.journalEntry.create({
        data: {
          date: transaction.createdAt || new Date(),
          description: `POS Transaction ${transaction.transactionNumber}`,
          reference: transaction.id,
          branchId: transaction.branchId,
          tenantId: transaction.tenantId,
          lines: {
            create: [
              { ledgerAccountId: cashAccount.id, debit: amount, credit: 0 },
              { ledgerAccountId: salesAccount.id, debit: 0, credit: amount },
            ]
          }
        }
      });
    }
  }
}
