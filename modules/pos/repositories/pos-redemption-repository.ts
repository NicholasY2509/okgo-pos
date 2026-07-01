import { prisma } from "@/lib/prisma";
import { PosUtils } from "../services/pos-utils";

export const PosRedemptionRepository = {
  async directRedeem(input: any) {
    return await prisma.$transaction(async (tx) => {
      const customerVoucher = await tx.customerVoucher.findUnique({
        where: { id: input.customerVoucherId },
        include: { voucherPacket: { include: { product: true } } }
      });

      if (!customerVoucher) throw new Error("Voucher tidak ditemukan.");
      if (customerVoucher.status !== "ACTIVE") throw new Error("Status voucher tidak aktif.");
      if (customerVoucher.remainingVisitCount == null || customerVoucher.remainingVisitCount <= 0) {
        throw new Error("Kuota kunjungan voucher sudah habis.");
      }

      const product = customerVoucher.voucherPacket.product;
      if (!product) throw new Error("Produk tidak ditemukan pada paket voucher.");

      const room = await tx.room.findUnique({ where: { id: input.roomId } });
      if (!room || !room.isActive) throw new Error(`Ruang tidak valid: ${input.roomId}`);
      if (room.branchId !== input.branchId) throw new Error(`Ruang ${room.name} tidak berada di cabang yang dipilih.`);

      const activeSessions = await tx.serviceSession.count({
        where: { roomId: input.roomId, status: "IN_PROGRESS" }
      });
      if (room.capacity !== null && (activeSessions + 1) > room.capacity) {
        throw new Error(`Kapasitas ruang ${room.name} penuh.`);
      }

      await tx.customerVoucher.update({
        where: { id: customerVoucher.id },
        data: {
          remainingVisitCount: customerVoucher.remainingVisitCount - 1,
          status: customerVoucher.remainingVisitCount - 1 === 0 ? "USED_UP" : "ACTIVE"
        }
      });

      const startTime = new Date();
      const endTime = product.duration ? new Date(startTime.getTime() + product.duration * 60000) : null;

      const transaction = await tx.transaction.create({
        data: {
          branchId: input.branchId,
          customerId: customerVoucher.customerId,
          transactionNumber: PosUtils.generateTransactionNumber(),
          subtotal: 0,
          discountTotal: 0,
          taxTotal: 0,
          totalAmount: 0,
          paidAmount: 0,
          changeAmount: 0,
          status: "COMPLETED",
          items: {
            create: {
              type: "SERVICE",
              serviceId: product.id,
              itemNameSnapshot: product.name,
              unitPrice: 0,
              quantity: 1,
              discountAmount: 0,
              subtotal: 0,
              serviceSessions: {
                create: {
                  staffId: input.staffId,
                  roomId: input.roomId,
                  branchId: input.branchId,
                  customerId: customerVoucher.customerId,
                  serviceId: product.id,
                  status: "IN_PROGRESS",
                  startTime,
                  endTime
                }
              }
            }
          }
        },
        include: { items: { include: { serviceSessions: true } } }
      });

      const item = transaction.items[0];
      const session = item.serviceSessions[0];

      await tx.voucherRedemption.create({
        data: {
          customerVoucherId: customerVoucher.id,
          transactionId: transaction.id,
          transactionItemId: item.id,
          serviceSessionId: session.id,
          redeemedVisitCount: 1,
          redeemedAmount: null
        }
      });

      return transaction;
    });
  }
};
