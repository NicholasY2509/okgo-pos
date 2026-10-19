import { AccountingUtils } from "./accounting-utils"

export class JournalEntryAutomation {
  static async handleTransactionCompleted(tx: any, transaction: any) {
    if (transaction.status !== "COMPLETED") return;

    // We expect transaction to have payments and items, otherwise we fetch them
    let payments = transaction.payments;
    if (!payments) {
      payments = await tx.transactionPayment.findMany({
        where: { transactionId: transaction.id },
        include: { paymentMethod: true }
      });
    }

    let items = transaction.items;
    if (!items) {
      items = await tx.transactionItem.findMany({
        where: { transactionId: transaction.id }
      });
    }

    // Look up the required Ledger Accounts by code
    const accounts = await tx.ledgerAccount.findMany({
      where: {
        code: { in: ['101', '111', '211', '411', '413'] }
      }
    });

    const getAccount = (code: string) => accounts.find((a: any) => a.code === code);

    const cashAcc = getAccount('101');
    const bankAcc = getAccount('111');
    const taxAcc = getAccount('211');
    const revenueAcc = getAccount('411');
    const voucherRevenueAcc = getAccount('413') || revenueAcc;

    if (!revenueAcc) {
      console.warn("Accounting accounts not fully seeded (missing 411). Cannot generate journal entry.");
      return;
    }

    const journalLines: any[] = [];

    // 1. DEBIT: Payment Methods (Cash / Bank)
    for (const payment of payments) {
      const type = payment.paymentMethod?.type || 'CASH';

      let targetAcc = null;
      if (type === 'CASH') {
        targetAcc = cashAcc; // Cash increase
      } else if (type === 'BANK' || type === 'TRANSFER' || type === 'QRIS' || type === 'EDC') {
        targetAcc = bankAcc; // Bank increase
      }

      if (targetAcc && Number(payment.amount) > 0) {
        journalLines.push({
          ledgerAccountId: targetAcc.id,
          debit: Number(payment.amount),
          credit: 0
        });
      }
    }

    // 2. CREDIT: Revenue Recognition (Service vs Voucher Packet)
    // Under ADR-0003, voucher packet purchases are recognized directly as revenue (account 413).
    // When a customer redeems a voucher, no secondary revenue/liability entry is created
    // to prevent double-counting revenue.
    let serviceRevenue = 0;
    let voucherRevenue = 0;

    for (const item of items) {
      if (item.type === 'VOUCHER_PACKET') {
        voucherRevenue += Number(item.subtotal);
      } else {
        serviceRevenue += Number(item.subtotal);
      }
    }

    if (serviceRevenue > 0) {
      journalLines.push({
        ledgerAccountId: revenueAcc.id,
        debit: 0,
        credit: serviceRevenue
      });
    }

    if (voucherRevenue > 0 && voucherRevenueAcc) {
      journalLines.push({
        ledgerAccountId: voucherRevenueAcc.id,
        debit: 0,
        credit: voucherRevenue
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
          journalNumber: AccountingUtils.generateJournalNumber(),
          date: transaction.createdAt || new Date(),
          description: `Penjualan POS #${transaction.transactionNumber}`,
          reference: transaction.transactionNumber,
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

