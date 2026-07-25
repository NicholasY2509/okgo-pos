import { JournalEntryInput } from "../schemas/journal-entry"

export class JournalEntryAutomation {
  static async handleTransactionCompleted(tx: any, transaction: any) {
    if (transaction.status !== "COMPLETED") return;

    // We expect transaction to have payments, otherwise we fetch it
    let payments = transaction.payments;
    if (!payments) {
      payments = await tx.transactionPayment.findMany({
        where: { transactionId: transaction.id },
        include: { paymentMethod: true }
      });
    }

    // Look up the required Ledger Accounts by code
    const accounts = await tx.ledgerAccount.findMany({
      where: {
        code: { in: ['101', '111', '411', '211', '212'] }
      }
    });

    const getAccount = (code: string) => accounts.find((a: any) => a.code === code);
    
    const cashAcc = getAccount('101');
    const bankAcc = getAccount('111');
    const revenueAcc = getAccount('411');
    const taxAcc = getAccount('211');
    const serviceAcc = getAccount('212');

    if (!revenueAcc) {
      console.warn("Accounting accounts not fully seeded. Cannot generate journal entry.");
      return;
    }

    const journalLines: any[] = [];

    // 1. DEBIT: Payment Methods (Cash / Bank)
    for (const payment of payments) {
      // Safely check if paymentMethod exists (if fetched properly)
      const type = payment.paymentMethod?.type || 'CASH';
      
      // Default CASH to Kas Tunai (101), others to Bank (111)
      const targetAcc = (type === 'CASH') ? cashAcc : bankAcc;

      if (targetAcc) {
        journalLines.push({
          ledgerAccountId: targetAcc.id,
          debit: Number(payment.amount),
          credit: 0
        });
      }
    }

    // 2. CREDIT: Sales Revenue (411)
    // The revenue is the subtotal (minus discount if applicable)
    const taxableRevenue = Number(transaction.subtotal) - Number(transaction.discountTotal);
    if (taxableRevenue > 0) {
      journalLines.push({
        ledgerAccountId: revenueAcc.id,
        debit: 0,
        credit: taxableRevenue
      });
    }

    // 3. CREDIT: Tax Payable (211)
    if (Number(transaction.taxTotal) > 0 && taxAcc) {
      journalLines.push({
        ledgerAccountId: taxAcc.id,
        debit: 0,
        credit: Number(transaction.taxTotal)
      });
    }

    // Calculate totals to ensure balance
    const totalDebit = journalLines.reduce((acc, line) => acc + Number(line.debit), 0);
    const totalCredit = journalLines.reduce((acc, line) => acc + Number(line.credit), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      console.error(`Journal entry for Transaction ${transaction.transactionNumber} is unbalanced. Debit: ${totalDebit}, Credit: ${totalCredit}`);
    }

    if (totalDebit > 0) {
      await tx.journalEntry.create({
        data: {
          date: transaction.createdAt || new Date(),
          description: `Penjualan POS #${transaction.transactionNumber}`,
          reference: transaction.id,
          branchId: transaction.branchId,
          tenantId: transaction.tenantId,
          lines: {
            create: journalLines
          }
        }
      });
    }
  }
}

