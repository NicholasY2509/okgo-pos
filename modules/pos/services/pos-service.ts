import { prisma } from "@/lib/prisma";
import { PosCheckoutInput } from "../schemas/pos-schema";
import { DiscountService } from "../../discount/services/discount-service";
import crypto from "crypto";

export class PosService {
  static generateTransactionNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const hex = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `TRX-${date}-${hex}`;
  }

  static generateVoucherCode(suffix?: string | null): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const hex = crypto.randomBytes(3).toString("hex").toUpperCase();
    return suffix ? `VCH-${date}-${hex}-${suffix}` : `VCH-${date}-${hex}`;
  }

  static async checkout(input: PosCheckoutInput) {
    return await prisma.$transaction(async (tx) => {
      await this.validatePreconditions(tx, input);

      const {
        subtotal,
        discountTotal,
        transactionItemsData,
        serviceSessionsData,
        customerVouchersData,
        itemVoucherRedemptionsData
      } = await this.processCartItems(tx, input);

      const totalAmount = subtotal - discountTotal;

      const {
        paidAmount,
        changeAmount,
        transactionPaymentsData,
        voucherRedemptionsData
      } = await this.processPayments(tx, input, totalAmount);

      const allVoucherRedemptionsData = [...voucherRedemptionsData, ...itemVoucherRedemptionsData];

      const transaction = await tx.transaction.create({
        data: {
          branchId: input.branchId,
          customerId: input.customerId || null,
          cashierId: input.cashierId || null,
          transactionNumber: this.generateTransactionNumber(),
          subtotal,
          discountTotal,
          taxTotal: 0,
          totalAmount,
          paidAmount,
          changeAmount,
          status: "COMPLETED",
          payments: {
            create: transactionPaymentsData
          }
        }
      });

      await this.createTransactionItemsAndLink(
        tx,
        input,
        transaction,
        transactionItemsData,
        serviceSessionsData,
        customerVouchersData,
        allVoucherRedemptionsData
      );

      return transaction;
    });
  }

  private static async validatePreconditions(tx: any, input: PosCheckoutInput) {
    const branch = await tx.branch.findUnique({ where: { id: input.branchId } });
    if (!branch || !branch.isActive) {
      throw new Error("Cabang tidak valid atau tidak aktif.");
    }

    if (input.customerId) {
      const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
      if (!customer) throw new Error("Pelanggan tidak valid.");
    }
  }

  private static async processCartItems(tx: any, input: PosCheckoutInput) {
    let subtotal = 0;
    let discountTotal = 0;
    const transactionItemsData: any[] = [];
    const serviceSessionsData: any[] = [];
    const customerVouchersData: any[] = [];
    const itemVoucherRedemptionsData: any[] = []; // NEW

    const applicableDiscountPercentage = await DiscountService.getApplicableDiscount(input.branchId);

    for (const item of input.items) {
      let unitPrice = 0;
      let itemNameSnapshot = "";

      if (item.type === "SERVICE") {
        const product = await tx.product.findUnique({ where: { id: item.serviceId } });
        if (!product || !product.isActive) throw new Error(`Layanan tidak valid: ${item.serviceId}`);

        unitPrice = Number(product.price);
        itemNameSnapshot = product.name;

        const staff = await tx.staff.findUnique({ where: { id: item.staffId } });
        if (!staff || !staff.isActive) throw new Error(`Staf tidak valid: ${item.staffId}`);

        const room = await tx.room.findUnique({ where: { id: item.roomId } });
        if (!room || !room.isActive) throw new Error(`Ruang tidak valid: ${item.roomId}`);
        if (room.branchId !== input.branchId) throw new Error(`Ruang ${room.name} tidak berada di cabang yang dipilih.`);

        serviceSessionsData.push({
          serviceId: item.serviceId,
          staffId: item.staffId,
          roomId: item.roomId,
          branchId: input.branchId,
          customerId: input.customerId || null,
        });

        // Handle item-level voucher redemption
        if (item.isVoucherRedemption && item.customerVoucherId) {
          const customerVoucher = await tx.customerVoucher.findUnique({
            where: { id: item.customerVoucherId },
            include: { voucherPacket: true }
          });

          if (!customerVoucher || customerVoucher.customerId !== input.customerId) {
            throw new Error("Voucher tidak ditemukan atau bukan milik pelanggan ini.");
          }
          if (customerVoucher.status !== "ACTIVE") throw new Error(`Status voucher adalah ${customerVoucher.status}.`);
          if (customerVoucher.expiresAt && customerVoucher.expiresAt < new Date()) {
            throw new Error("Voucher telah kedaluwarsa.");
          }

          if (customerVoucher.remainingVisitCount != null) {
            if (customerVoucher.remainingVisitCount <= 0) throw new Error("Kuota kunjungan voucher telah habis.");
            await tx.customerVoucher.update({
              where: { id: customerVoucher.id },
              data: {
                remainingVisitCount: customerVoucher.remainingVisitCount - 1,
                status: customerVoucher.remainingVisitCount - 1 === 0 ? "USED_UP" : "ACTIVE"
              }
            });
            itemVoucherRedemptionsData.push({
              customerVoucherId: customerVoucher.id,
              redeemedVisitCount: 1,
              redeemedAmount: null,
              _tempItemIndex: transactionItemsData.length // to link later
            });
          } else {
            throw new Error("Penukaran level item saat ini hanya mendukung voucher berbasis kunjungan.");
          }
        }

      } else if (item.type === "VOUCHER_PACKET") {
        if (!input.customerId) {
          throw new Error("Pelanggan wajib dipilih saat membeli paket voucher.");
        }
        const packet = await tx.voucherPacket.findUnique({ where: { id: item.voucherPacketId } });
        if (!packet || !packet.isActive) throw new Error(`Paket voucher tidak valid: ${item.voucherPacketId}`);

        unitPrice = Number(packet.price);
        itemNameSnapshot = packet.name;

        customerVouchersData.push({
          packet,
          quantity: item.quantity
        });
      }

      let totalItemDiscount = 0;
      if (item.type === "SERVICE") {
        if (item.isVoucherRedemption) {
          totalItemDiscount = unitPrice * item.quantity; // 100% discount
        } else if (applicableDiscountPercentage > 0) {
          totalItemDiscount = (unitPrice * item.quantity * applicableDiscountPercentage) / 100;
        }
      }

      const itemSubtotal = (unitPrice * item.quantity) - totalItemDiscount;
      if (itemSubtotal < 0) throw new Error(`Diskon tidak boleh melebihi total harga untuk ${itemNameSnapshot}`);

      subtotal += (unitPrice * item.quantity);
      discountTotal += totalItemDiscount;

      transactionItemsData.push({
        type: item.type,
        serviceId: item.type === "SERVICE" ? item.serviceId : null,
        voucherPacketId: item.type === "VOUCHER_PACKET" ? item.voucherPacketId : null,
        itemNameSnapshot,
        unitPrice,
        quantity: item.quantity,
        discountAmount: totalItemDiscount,
        subtotal: itemSubtotal,
        _tempType: item.type
      });
    }

    return { subtotal, discountTotal, transactionItemsData, serviceSessionsData, customerVouchersData, itemVoucherRedemptionsData };
  }

  private static async processPayments(tx: any, input: PosCheckoutInput, totalAmount: number) {
    let paidAmount = 0;
    const transactionPaymentsData: any[] = [];
    const voucherRedemptionsData: any[] = [];

    for (const payment of input.payments) {
      const pm = await tx.paymentMethod.findUnique({ where: { id: payment.paymentMethodId } });
      if (!pm || !pm.isActive) throw new Error(`Metode pembayaran tidak valid: ${payment.paymentMethodId}`);

      if (pm.type === "VOUCHER") {
        if (!payment.voucherCode) throw new Error("Kode voucher wajib diisi untuk pembayaran dengan voucher.");
        if (!input.customerId) throw new Error("Pelanggan wajib dipilih untuk pembayaran dengan voucher.");

        const customerVoucher = await tx.customerVoucher.findUnique({
          where: { code: payment.voucherCode },
          include: { voucherPacket: true }
        });

        if (!customerVoucher || customerVoucher.customerId !== input.customerId) {
          throw new Error("Voucher tidak ditemukan atau bukan milik pelanggan ini.");
        }
        if (customerVoucher.status !== "ACTIVE") throw new Error(`Status voucher adalah ${customerVoucher.status}.`);
        if (customerVoucher.expiresAt && customerVoucher.expiresAt < new Date()) {
          throw new Error("Voucher telah kedaluwarsa.");
        }

        if (customerVoucher.remainingVisitCount != null) {
          if (customerVoucher.remainingVisitCount <= 0) throw new Error("Kuota kunjungan voucher telah habis.");
          await tx.customerVoucher.update({
            where: { id: customerVoucher.id },
            data: {
              remainingVisitCount: customerVoucher.remainingVisitCount - 1,
              status: customerVoucher.remainingVisitCount - 1 === 0 ? "USED_UP" : "ACTIVE"
            }
          });
          voucherRedemptionsData.push({
            customerVoucherId: customerVoucher.id,
            redeemedVisitCount: 1,
            redeemedAmount: null
          });
        } else if (customerVoucher.remainingCreditAmount != null) {
          if (Number(customerVoucher.remainingCreditAmount) < payment.amount) {
            throw new Error("Saldo nominal voucher tidak mencukupi.");
          }
          const newBalance = Number(customerVoucher.remainingCreditAmount) - payment.amount;
          await tx.customerVoucher.update({
            where: { id: customerVoucher.id },
            data: {
              remainingCreditAmount: newBalance,
              status: newBalance === 0 ? "USED_UP" : "ACTIVE"
            }
          });
          voucherRedemptionsData.push({
            customerVoucherId: customerVoucher.id,
            redeemedVisitCount: null,
            redeemedAmount: payment.amount
          });
        } else {
          throw new Error("Konfigurasi voucher tidak valid.");
        }
      } else {
        if (payment.voucherCode) throw new Error("Kode voucher tidak boleh diisi untuk pembayaran non-voucher.");
      }

      paidAmount += payment.amount;
      transactionPaymentsData.push({
        paymentMethodId: payment.paymentMethodId,
        amount: payment.amount,
        referenceNumber: payment.referenceNumber || null,
        notes: payment.notes || null,
      });
    }

    if (paidAmount < totalAmount) {
      throw new Error(`Jumlah pembayaran kurang. Total tagihan Rp ${totalAmount}, tetapi hanya dibayar Rp ${paidAmount}.`);
    }

    const changeAmount = paidAmount - totalAmount;

    return { paidAmount, changeAmount, transactionPaymentsData, voucherRedemptionsData };
  }

  private static async createTransactionItemsAndLink(
    tx: any,
    input: PosCheckoutInput,
    transaction: any,
    transactionItemsData: any[],
    serviceSessionsData: any[],
    customerVouchersData: any[],
    voucherRedemptionsData: any[]
  ) {
    let serviceIndex = 0;

    for (const itemData of transactionItemsData) {
      const itemType = itemData._tempType;
      delete itemData._tempType;

      const createdItem = await tx.transactionItem.create({
        data: {
          ...itemData,
          transactionId: transaction.id,
        }
      });

      if (itemType === "SERVICE") {
        const sessionData = serviceSessionsData[serviceIndex];

        for (let i = 0; i < createdItem.quantity; i++) {
          const createdSession = await tx.serviceSession.create({
            data: {
              ...sessionData,
              transactionItemId: createdItem.id,
            }
          });

          if (voucherRedemptionsData.length > 0) {
            for (const vr of voucherRedemptionsData) {
              if (vr._tempItemIndex === serviceIndex && !vr.transactionId) {
                vr.transactionId = transaction.id;
                vr.transactionItemId = createdItem.id;
                vr.serviceSessionId = createdSession.id;
              } else if (!vr._tempItemIndex && !vr.transactionId) {
                // Payments voucher redemption doesn't have a specific item
                vr.transactionId = transaction.id;
                vr.transactionItemId = createdItem.id;
                vr.serviceSessionId = createdSession.id;
              }
            }
          }
        }
        serviceIndex++;
      } else if (itemType === "VOUCHER_PACKET") {
        const cvDataList = customerVouchersData.find(cv => cv.packet.id === createdItem.voucherPacketId);
        if (cvDataList) {
          for (let i = 0; i < cvDataList.quantity; i++) {
            const packet = cvDataList.packet;
            let expiresAt = null;
            if (packet.validityDays) {
              const d = new Date();
              d.setDate(d.getDate() + packet.validityDays);
              expiresAt = d;
            }

            if (packet.totalVisitCount && packet.totalVisitCount > 0) {
              for (let v = 0; v < packet.totalVisitCount; v++) {
                await tx.customerVoucher.create({
                  data: {
                    code: this.generateVoucherCode(packet.codeSuffix),
                    customerId: input.customerId!,
                    voucherPacketId: packet.id,
                    sourceTransactionId: transaction.id,
                    sourceTransactionItemId: createdItem.id,
                    initialVisitCount: 1,
                    remainingVisitCount: 1,
                    initialCreditAmount: null,
                    remainingCreditAmount: null,
                    status: "ACTIVE",
                    expiresAt
                  }
                });
              }
            } else {
              await tx.customerVoucher.create({
                data: {
                  code: this.generateVoucherCode(packet.codeSuffix),
                  customerId: input.customerId!,
                  voucherPacketId: packet.id,
                  sourceTransactionId: transaction.id,
                  sourceTransactionItemId: createdItem.id,
                  initialVisitCount: null,
                  remainingVisitCount: null,
                  initialCreditAmount: packet.totalCreditAmount,
                  remainingCreditAmount: packet.totalCreditAmount,
                  status: "ACTIVE",
                  expiresAt
                }
              });
            }
          }
        }
      }
    }

    for (const vr of voucherRedemptionsData) {
      const data: any = {
        customerVoucherId: vr.customerVoucherId,
        transactionId: vr.transactionId || transaction.id,
        redeemedVisitCount: vr.redeemedVisitCount,
        redeemedAmount: vr.redeemedAmount
      };

      if (vr.transactionItemId) data.transactionItemId = vr.transactionItemId;
      if (vr.serviceSessionId) data.serviceSessionId = vr.serviceSessionId;

      await tx.voucherRedemption.create({
        data
      })
    }
  }

  static async cancelTransaction(transactionId: string) {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: {
          items: { include: { serviceSessions: true } },
          voucherRedemptions: true
        }
      });

      if (!transaction) throw new Error("Transaksi tidak ditemukan.");
      if (transaction.status === "VOIDED" || transaction.status === "CANCELLED") {
        throw new Error("Transaksi sudah dibatalkan.");
      }

      // 1. Mark transaction as VOIDED
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: "VOIDED" }
      });

      // 2. Mark related service sessions as CANCELLED
      for (const item of transaction.items) {
        for (const session of item.serviceSessions) {
          await tx.serviceSession.update({
            where: { id: session.id },
            data: { status: "CANCELLED" }
          });
        }
      }

      // 3. Restore any vouchers generated by this transaction
      const generatedVouchers = await tx.customerVoucher.findMany({
        where: { sourceTransactionId: transaction.id }
      });

      for (const voucher of generatedVouchers) {
        const redemptions = await tx.voucherRedemption.count({ where: { customerVoucherId: voucher.id } });
        if (redemptions > 0) throw new Error("Tidak dapat membatalkan transaksi karena voucher yang dibeli sudah digunakan.");

        await tx.customerVoucher.update({
          where: { id: voucher.id },
          data: { status: "VOID" }
        });
      }

      // 4. Reverse any vouchers redeemed BY this transaction
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

      return { success: true };
    });
  }
}

