import { prisma } from "@/lib/prisma";

export const PosPaymentRepository = {
  async payExistingTransaction(input: {
    transactionId: string;
    payments: {
      paymentMethodId: string;
      amount: number;
      referenceNumber?: string;
      voucherCode?: string;
      notes?: string;
    }[];
  }) {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: input.transactionId },
        include: { items: true }
      });

      if (!transaction) throw new Error("Transaksi tidak ditemukan.");
      if (transaction.status === "COMPLETED") throw new Error("Transaksi sudah lunas.");

      const totalAmount = Number(transaction.totalAmount);
      let paidAmount = 0;
      
      const visitVoucherUsage: Record<string, number> = {};

      for (const payment of input.payments) {
        let paymentAmount = payment.amount;
        const pm = await tx.paymentMethod.findUnique({ where: { id: payment.paymentMethodId } });
        if (!pm) throw new Error(`Metode pembayaran tidak valid: ${payment.paymentMethodId}`);

        if (pm.type === "VOUCHER") {
          if (!payment.voucherCode) throw new Error("Kode voucher wajib untuk pembayaran dengan voucher.");

          const customerVoucher = await tx.customerVoucher.findUnique({
            where: { code: payment.voucherCode },
            include: { voucherPacket: true }
          });

          if (!customerVoucher || customerVoucher.status !== "ACTIVE") {
            throw new Error(`Voucher tidak valid atau sudah kadaluarsa: ${payment.voucherCode}`);
          }

          if (customerVoucher.voucherPacket.totalVisitCount) {
            const remainingVisit = customerVoucher.remainingVisitCount || 0;
            if (remainingVisit < 1) {
              throw new Error(`Kuota visit voucher habis.`);
            }

            const productId = customerVoucher.voucherPacket.productId;
            let matchedItem = null;

            for (const item of transaction.items) {
              if (!productId || item.serviceId === productId) {
                const usedQty = visitVoucherUsage[item.id] || 0;
                if (usedQty < item.quantity) {
                  matchedItem = item;
                  visitVoucherUsage[item.id] = usedQty + 1;
                  break;
                }
              }
            }

            if (!matchedItem) {
              throw new Error(`Tidak ada layanan di transaksi ini yang sesuai dengan voucher ${payment.voucherCode}.`);
            }

            paymentAmount = Number(matchedItem.subtotal) / matchedItem.quantity;

            const newRemaining = remainingVisit - 1;
            await tx.customerVoucher.update({
              where: { id: customerVoucher.id },
              data: {
                remainingVisitCount: newRemaining,
                status: newRemaining <= 0 ? "USED_UP" : "ACTIVE"
              }
            });

            await tx.voucherRedemption.create({
              data: {
                customerVoucherId: customerVoucher.id,
                transactionId: transaction.id,
                transactionItemId: matchedItem.id, 
                redeemedAmount: paymentAmount
              }
            });

          } else if (customerVoucher.voucherPacket.totalCreditAmount) {
            const remainingCredit = Number(customerVoucher.remainingCreditAmount || 0);
            if (remainingCredit < paymentAmount) {
              throw new Error(`Saldo voucher tidak mencukupi. Saldo: ${remainingCredit}`);
            }

            const newRemaining = remainingCredit - paymentAmount;
            await tx.customerVoucher.update({
              where: { id: customerVoucher.id },
              data: {
                remainingCreditAmount: newRemaining,
                status: newRemaining <= 0 ? "USED_UP" : "ACTIVE"
              }
            });

            await tx.voucherRedemption.create({
              data: {
                customerVoucherId: customerVoucher.id,
                transactionId: transaction.id,
                redeemedAmount: paymentAmount
              }
            });
          } else {
            throw new Error(`Tipe voucher tidak dikenali.`);
          }
        }

        paidAmount += paymentAmount;

        await tx.transactionPayment.create({
          data: {
            transactionId: transaction.id,
            paymentMethodId: payment.paymentMethodId,
            amount: paymentAmount,
            referenceNumber: payment.referenceNumber,
            notes: payment.notes
          }
        });
      }

      const newPaidAmount = Number(transaction.paidAmount) + paidAmount;
      const changeAmount = Math.max(0, newPaidAmount - totalAmount);
      const isCompleted = newPaidAmount >= totalAmount;

      return await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          paidAmount: newPaidAmount,
          changeAmount,
          status: isCompleted ? "COMPLETED" : "PENDING"
        }
      });
    });
  }
};
