import { prisma } from "@/lib/prisma";
import { JournalEntryAutomation } from "@/modules/accounting/services/journal-entry-automation";
import { PosUtils } from "../services/pos-utils";

export const PosTransactionRepository = {
  async cancelTransaction(transactionId: string) {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: {
          items: {
            include: {
              serviceSessions: true,
              serviceSessionSegments: true
            }
          },
          voucherRedemptions: true
        }
      });

      if (!transaction) throw new Error("Transaksi tidak ditemukan.");
      if (transaction.status === "VOIDED" || transaction.status === "CANCELLED") {
        throw new Error("Transaksi sudah dibatalkan.");
      }

      // 0. Enforce 2 days mark (48 hours)
      const diffInMs = Date.now() - new Date(transaction.createdAt).getTime();
      const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
      if (diffInMs > twoDaysInMs) {
        throw new Error("Transaksi yang sudah melewati batas 2 hari tidak dapat dibatalkan.");
      }

      const isPendingTx = transaction.status === "PENDING";

      if (isPendingTx) {
        const hasStartedOrCompletedSession = transaction.items.some((item) =>
          item.serviceSessions.some((s) => s.status === "IN_PROGRESS" || s.status === "COMPLETED")
        );
        if (hasStartedOrCompletedSession) {
          throw new Error(
            "Tidak dapat membatalkan transaksi yang belum lunas karena sesi layanan sudah dimulai atau selesai."
          );
        }
      }

      // 1. Validate generated vouchers before mutating state
      // A voucher packet purchase can ONLY be cancelled if EVERY single voucher inside hasn't been used
      const generatedVouchers = await tx.customerVoucher.findMany({
        where: { sourceTransactionId: transaction.id },
        include: {
          redemptions: {
            where: {
              transaction: {
                status: { notIn: ["CANCELLED", "VOIDED"] }
              }
            }
          }
        }
      });

      if (generatedVouchers.length > 0) {
        const usedVouchers = generatedVouchers.filter((voucher) => {
          const hasRedemptions = Boolean(voucher.redemptions && voucher.redemptions.length > 0);
          const isNotActive = voucher.status !== "ACTIVE";
          const visitUsed =
            voucher.initialVisitCount != null &&
            voucher.remainingVisitCount != null &&
            voucher.remainingVisitCount < voucher.initialVisitCount;
          const creditUsed =
            voucher.initialCreditAmount != null &&
            voucher.remainingCreditAmount != null &&
            Number(voucher.remainingCreditAmount) < Number(voucher.initialCreditAmount);

          return hasRedemptions || isNotActive || visitUsed || creditUsed;
        });

        if (usedVouchers.length > 0) {
          throw new Error(
            `Tidak dapat membatalkan transaksi karena ${usedVouchers.length} dari ${generatedVouchers.length} voucher yang dibeli sudah digunakan.`
          );
        }

        // Void all generated vouchers since every one of them is untouched
        await tx.customerVoucher.updateMany({
          where: { sourceTransactionId: transaction.id },
          data: { status: "VOID" }
        });
      }

      // 2. Mark transaction as CANCELLED
      const updatedTx = await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: "CANCELLED" }
      });

      let reopenedTransaction: { id: string; transactionNumber: string } | null = null;
      const itemIds = transaction.items.map((i) => i.id);
      const sessionIds = transaction.items.flatMap((i) => i.serviceSessions.map((s) => s.id));

      // 3. Separate payment cancellation from service sessions:
      // - For paid/completed transactions: keep service sessions & bookings alive by moving them to a new PENDING transaction
      // - For PENDING transactions (with only SCHEDULED sessions): cancel the scheduled sessions & bookings
      if (!isPendingTx) {
        const serviceItems = transaction.items.filter(
          (item) =>
            item.serviceSessions.length > 0 ||
            (item.serviceSessionSegments && item.serviceSessionSegments.length > 0)
        );

        if (serviceItems.length > 0) {
          const newSubtotal = serviceItems.reduce(
            (sum, item) => sum + Number(item.unitPrice) * item.quantity,
            0
          );
          const newDiscountTotal = serviceItems.reduce(
            (sum, item) => sum + Number(item.discountAmount || 0),
            0
          );
          const newTotalAmount = serviceItems.reduce(
            (sum, item) => sum + Number(item.subtotal),
            0
          );

          const createdPendingTx = await tx.transaction.create({
            data: {
              tenantId: transaction.tenantId,
              branchId: transaction.branchId,
              customerId: transaction.customerId,
              cashierId: transaction.cashierId,
              transactionNumber: PosUtils.generateTransactionNumber(),
              subtotal: newSubtotal,
              discountTotal: newDiscountTotal,
              taxTotal: 0,
              totalAmount: newTotalAmount,
              paidAmount: 0,
              changeAmount: 0,
              status: "PENDING",
              isVip: transaction.isVip
            }
          });

          reopenedTransaction = {
            id: createdPendingTx.id,
            transactionNumber: createdPendingTx.transactionNumber
          };

          for (const item of serviceItems) {
            const newItem = await tx.transactionItem.create({
              data: {
                transactionId: createdPendingTx.id,
                type: item.type,
                serviceId: item.serviceId,
                voucherPacketId: item.voucherPacketId,
                itemNameSnapshot: item.itemNameSnapshot,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                discountAmount: item.discountAmount,
                subtotal: item.subtotal,
                cashierIncentiveAmount: 0
              }
            });

            await tx.serviceSession.updateMany({
              where: { transactionItemId: item.id },
              data: { transactionItemId: newItem.id }
            });

            await tx.serviceSessionSegment.updateMany({
              where: { transactionItemId: item.id },
              data: { transactionItemId: newItem.id }
            });

            await tx.staffIncentive.updateMany({
              where: {
                transactionItemId: item.id,
                serviceSessionId: { not: null }
              },
              data: { transactionItemId: newItem.id }
            });
          }
        }

        // Delete remaining incentives on the cancelled transaction (e.g. cashier voucher commission)
        if (itemIds.length > 0) {
          await tx.staffIncentive.deleteMany({
            where: { transactionItemId: { in: itemIds } }
          });
        }
      } else {
        for (const item of transaction.items) {
          for (const session of item.serviceSessions) {
            await tx.serviceSession.update({
              where: { id: session.id },
              data: { status: "CANCELLED" }
            });
          }
        }

        const bookingIds = Array.from(
          new Set(
            transaction.items
              .flatMap((i) => i.serviceSessions.map((s) => s.bookingId))
              .filter((id): id is string => Boolean(id))
          )
        );
        if (bookingIds.length > 0) {
          await tx.booking.updateMany({
            where: { id: { in: bookingIds } },
            data: { status: "CANCELLED" }
          });
        }

        if (itemIds.length > 0 || sessionIds.length > 0) {
          await tx.staffIncentive.deleteMany({
            where: {
              OR: [
                ...(itemIds.length > 0 ? [{ transactionItemId: { in: itemIds } }] : []),
                ...(sessionIds.length > 0 ? [{ serviceSessionId: { in: sessionIds } }] : [])
              ]
            }
          });
        }
      }

      // 4. Reverse any vouchers redeemed BY this transaction and remove redemption records
      for (const redemption of transaction.voucherRedemptions) {
        const voucher = await tx.customerVoucher.findUnique({ where: { id: redemption.customerVoucherId } });
        if (voucher) {
          const newVisitCount = voucher.remainingVisitCount != null ? voucher.remainingVisitCount + (redemption.redeemedVisitCount || 0) : null;
          const newCreditAmount = voucher.remainingCreditAmount != null ? Number(voucher.remainingCreditAmount) + Number(redemption.redeemedAmount || 0) : null;

          await tx.customerVoucher.update({
            where: { id: voucher.id },
            data: {
              remainingVisitCount: newVisitCount,
              remainingCreditAmount: newCreditAmount,
              status: "ACTIVE"
            }
          });
        }
      }

      if (transaction.voucherRedemptions.length > 0) {
        await tx.voucherRedemption.deleteMany({
          where: { transactionId: transaction.id }
        });
      }

      // 5. Accounting: Handle reversal journal entry
      await JournalEntryAutomation.handleTransactionCancelled(tx, transaction);

      return { success: true, transaction: updatedTx, reopenedTransaction };
    });
  }
};
