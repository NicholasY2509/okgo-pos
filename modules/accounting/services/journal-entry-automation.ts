import { JournalEntryInput } from "../schemas/journal-entry"

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
        code: { in: ['101', '111', '211', '214', '411'] }
      }
    });

    const getAccount = (code: string) => accounts.find((a: any) => a.code === code);

    const cashAcc = getAccount('101');
    const bankAcc = getAccount('111');
    const taxAcc = getAccount('211');
    const voucherLiabilityAcc = getAccount('214');
    const revenueAcc = getAccount('411');

    if (!revenueAcc || !voucherLiabilityAcc) {
      console.warn("Accounting accounts not fully seeded (missing 411 or 214). Cannot generate journal entry.");
      return;
    }

    const journalLines: any[] = [];

    // 1. DEBIT: Payment Methods (Cash / Bank / Voucher Redemption)
    for (const payment of payments) {
      const type = payment.paymentMethod?.type || 'CASH';

      let targetAcc = null;
      if (type === 'VOUCHER') {
        targetAcc = voucherLiabilityAcc; // Redeeming reduces liability
      } else if (type === 'CASH') {
        targetAcc = cashAcc; // Cash increase
      } else {
        targetAcc = bankAcc; // Bank increase (QRIS, TRANSFER, EDC)
      }

      if (targetAcc) {
        journalLines.push({
          ledgerAccountId: targetAcc.id,
          debit: Number(payment.amount),
          credit: 0
        });
      }
    }

    // 2. CREDIT: Revenue Recognition (Service vs Voucher Packet)
    // item.subtotal already has item-level and prorated discount applied
    let serviceRevenue = 0;
    let unearnedVoucherRevenue = 0;

    for (const item of items) {
      if (item.type === 'VOUCHER_PACKET') {
        unearnedVoucherRevenue += Number(item.subtotal);
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

    if (unearnedVoucherRevenue > 0) {
      journalLines.push({
        ledgerAccountId: voucherLiabilityAcc.id,
        debit: 0,
        credit: unearnedVoucherRevenue
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

