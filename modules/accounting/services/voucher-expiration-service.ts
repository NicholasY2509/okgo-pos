import { prisma } from "@/lib/prisma"
import { AccountingUtils } from "./accounting-utils"

export class VoucherExpirationService {
  static async processExpiredVouchers() {
    return await prisma.$transaction(async (tx) => {
      // Find vouchers that are ACTIVE, have an expiration date, and are past that date.
      const expiredVouchers = await tx.customerVoucher.findMany({
        where: {
          status: "ACTIVE",
          expiresAt: {
            not: null,
            lt: new Date(),
          }
        },
        include: {
          voucherPacket: true,
          customer: true
        }
      });

      if (expiredVouchers.length === 0) {
        return { count: 0, recognizedValue: 0 };
      }

      // Look up required ledger accounts
      const accounts = await tx.ledgerAccount.findMany({
        where: { code: { in: ['214', '412'] } }
      });

      const voucherLiabilityAcc = accounts.find((a: any) => a.code === '214');
      const breakageRevenueAcc = accounts.find((a: any) => a.code === '412');

      if (!voucherLiabilityAcc || !breakageRevenueAcc) {
        console.warn("Missing accounts 214 or 412, cannot process expired vouchers into accounting.");
        // Still update the vouchers' status even if accounting is missing
        await tx.customerVoucher.updateMany({
          where: { id: { in: expiredVouchers.map(v => v.id) } },
          data: { status: "EXPIRED" }
        });
        return { count: expiredVouchers.length, recognizedValue: 0, warning: "Missing COA" };
      }

      // Try to get a default branch for system-level entries if source transaction has no branch
      const firstBranch = await tx.branch.findFirst();
      const defaultBranchId = firstBranch ? firstBranch.id : "admin";

      let totalRecognizedValue = 0;
      let expiredCount = 0;

      for (const voucher of expiredVouchers) {
        const packet = voucher.voucherPacket;
        let value = 0;

        if (voucher.remainingVisitCount && packet.totalVisitCount && packet.price) {
          const valuePerVisit = Number(packet.price) / packet.totalVisitCount;
          value = valuePerVisit * voucher.remainingVisitCount;
        } else if (voucher.remainingCreditAmount) {
          value = Number(voucher.remainingCreditAmount);
        }

        // 1. Update Voucher Status
        await tx.customerVoucher.update({
          where: { id: voucher.id },
          data: { status: "EXPIRED" }
        });

        expiredCount++;

        if (value > 0) {
          totalRecognizedValue += value;

          let branchId = defaultBranchId;
          let tenantId = undefined;

          // Try to get branch from source transaction if available
          if (voucher.sourceTransactionId) {
            const sourceTx = await tx.transaction.findUnique({
              where: { id: voucher.sourceTransactionId },
              select: { branchId: true, tenantId: true }
            });
            if (sourceTx) {
              branchId = sourceTx.branchId;
              tenantId = sourceTx.tenantId || undefined;
            }
          }

          // 2. Generate Journal Entry
          const journalNumber = AccountingUtils.generateJournalNumber();
          await tx.journalEntry.create({
            data: {
              journalNumber,
              date: new Date(), // recognize at the time the cron runs
              description: `Voucher Kedaluwarsa: ${voucher.code} (${voucher.customer?.name || "Unknown"})`,
              reference: voucher.code,
              branchId,
              tenantId,
              lines: {
                create: [
                  {
                    ledgerAccountId: voucherLiabilityAcc.id,
                    debit: value,
                    credit: 0
                  },
                  {
                    ledgerAccountId: breakageRevenueAcc.id,
                    debit: 0,
                    credit: value
                  }
                ]
              }
            }
          });
        }
      }

      return { count: expiredCount, recognizedValue: totalRecognizedValue };
    });
  }
}
