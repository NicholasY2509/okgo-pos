import { prisma } from "@/lib/prisma";

export class PosPaymentService {
  static async payExistingTransaction(input: {
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
        where: { id: input.transactionId }
      });

      if (!transaction) throw new Error("Transaksi tidak ditemukan.");
      if (transaction.status === "COMPLETED") throw new Error("Transaksi sudah lunas.");

      const totalAmount = Number(transaction.totalAmount);
      let paidAmount = 0;

      for (const payment of input.payments) {
        paidAmount += payment.amount;

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
          if (!customerVoucher.voucherPacket.totalCreditAmount) {
            throw new Error(`Voucher ${payment.voucherCode} bukan voucher nominal.`);
          }

          const remainingCredit = Number(customerVoucher.remainingCreditAmount || 0);
          if (remainingCredit < payment.amount) {
            throw new Error(`Saldo voucher tidak mencukupi. Saldo: ${remainingCredit}`);
          }

          const newRemaining = remainingCredit - payment.amount;
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
              redeemedAmount: payment.amount
            }
          });
        }

        await tx.transactionPayment.create({
          data: {
            transactionId: transaction.id,
            paymentMethodId: payment.paymentMethodId,
            amount: payment.amount,
            referenceNumber: payment.referenceNumber,
            notes: payment.notes
          }
        });
      }

      const changeAmount = Math.max(0, paidAmount - totalAmount);

      return await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          paidAmount: Number(transaction.paidAmount) + paidAmount,
          changeAmount,
          status: "COMPLETED"
        }
      });
    });
  }
}
