import { prisma } from "@/lib/prisma";
import { PosCheckoutInput } from "../schemas/pos-schema";
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
        customerVouchersData
      } = await this.processCartItems(tx, input);

      const totalAmount = subtotal - discountTotal;

      const {
        paidAmount,
        changeAmount,
        transactionPaymentsData,
        voucherRedemptionsData
      } = await this.processPayments(tx, input, totalAmount);

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
        voucherRedemptionsData
      );

      return transaction;
    });
  }

  private static async validatePreconditions(tx: any, input: PosCheckoutInput) {
    const branch = await tx.branch.findUnique({ where: { id: input.branchId } });
    if (!branch || !branch.isActive) {
      throw new Error("Invalid or inactive branch.");
    }

    if (input.customerId) {
      const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
      if (!customer) throw new Error("Invalid customer.");
    }
  }

  private static async processCartItems(tx: any, input: PosCheckoutInput) {
    let subtotal = 0;
    let discountTotal = 0;
    const transactionItemsData: any[] = [];
    const serviceSessionsData: any[] = [];
    const customerVouchersData: any[] = [];

    for (const item of input.items) {
      let unitPrice = 0;
      let itemNameSnapshot = "";

      if (item.type === "SERVICE") {
        const product = await tx.product.findUnique({ where: { id: item.serviceId } });
        if (!product || !product.isActive) throw new Error(`Invalid service: ${item.serviceId}`);

        unitPrice = Number(product.price);
        itemNameSnapshot = product.name;

        const staff = await tx.staff.findUnique({ where: { id: item.staffId } });
        if (!staff || !staff.isActive) throw new Error(`Invalid staff: ${item.staffId}`);

        const room = await tx.room.findUnique({ where: { id: item.roomId } });
        if (!room || !room.isActive) throw new Error(`Invalid room: ${item.roomId}`);
        if (room.branchId !== input.branchId) throw new Error(`Room ${room.name} does not belong to the selected branch.`);

        serviceSessionsData.push({
          serviceId: item.serviceId,
          staffId: item.staffId,
          roomId: item.roomId,
          branchId: input.branchId,
          customerId: input.customerId || null,
        });

      } else if (item.type === "VOUCHER_PACKET") {
        if (!input.customerId) {
          throw new Error("Customer is required when purchasing a voucher packet.");
        }
        const packet = await tx.voucherPacket.findUnique({ where: { id: item.voucherPacketId } });
        if (!packet || !packet.isActive) throw new Error(`Invalid voucher packet: ${item.voucherPacketId}`);

        unitPrice = Number(packet.price);
        itemNameSnapshot = packet.name;

        customerVouchersData.push({
          packet,
          quantity: item.quantity
        });
      }

      const itemSubtotal = (unitPrice * item.quantity) - item.discountAmount;
      if (itemSubtotal < 0) throw new Error(`Discount cannot exceed item total for ${itemNameSnapshot}`);

      subtotal += (unitPrice * item.quantity);
      discountTotal += item.discountAmount;

      transactionItemsData.push({
        type: item.type,
        serviceId: item.type === "SERVICE" ? item.serviceId : null,
        voucherPacketId: item.type === "VOUCHER_PACKET" ? item.voucherPacketId : null,
        itemNameSnapshot,
        unitPrice,
        quantity: item.quantity,
        discountAmount: item.discountAmount,
        subtotal: itemSubtotal,
        _tempType: item.type
      });
    }

    return { subtotal, discountTotal, transactionItemsData, serviceSessionsData, customerVouchersData };
  }

  private static async processPayments(tx: any, input: PosCheckoutInput, totalAmount: number) {
    let paidAmount = 0;
    const transactionPaymentsData: any[] = [];
    const voucherRedemptionsData: any[] = [];

    for (const payment of input.payments) {
      const pm = await tx.paymentMethod.findUnique({ where: { id: payment.paymentMethodId } });
      if (!pm || !pm.isActive) throw new Error(`Invalid payment method: ${payment.paymentMethodId}`);

      if (pm.type === "VOUCHER") {
        if (!payment.voucherCode) throw new Error("Voucher code is required for voucher payments.");
        if (!input.customerId) throw new Error("Customer is required for voucher payments.");

        const customerVoucher = await tx.customerVoucher.findUnique({
          where: { code: payment.voucherCode },
          include: { voucherPacket: true }
        });

        if (!customerVoucher || customerVoucher.customerId !== input.customerId) {
          throw new Error("Voucher not found or does not belong to the customer.");
        }
        if (customerVoucher.status !== "ACTIVE") throw new Error(`Voucher status is ${customerVoucher.status}.`);
        if (customerVoucher.expiresAt && customerVoucher.expiresAt < new Date()) {
          throw new Error("Voucher has expired.");
        }

        if (customerVoucher.remainingVisitCount != null) {
          if (customerVoucher.remainingVisitCount <= 0) throw new Error("Voucher has no visits left.");
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
            throw new Error("Insufficient voucher credit balance.");
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
          throw new Error("Invalid voucher configuration.");
        }
      } else {
        if (payment.voucherCode) throw new Error("Voucher code should not be provided for non-voucher payments.");
      }

      paidAmount += payment.amount;
      transactionPaymentsData.push({
        paymentMethodId: payment.paymentMethodId,
        amount: payment.amount,
        referenceNumber: payment.referenceNumber || null,
      });
    }

    if (paidAmount < totalAmount) {
      throw new Error(`Insufficient payment amount. Total is ${totalAmount}, but only ${paidAmount} was paid.`);
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
              if (!vr.transactionId) {
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
      await tx.voucherRedemption.create({
        data: {
          customerVoucherId: vr.customerVoucherId,
          transactionId: transaction.id,
          transactionItemId: vr.transactionItemId || null,
          serviceSessionId: vr.serviceSessionId || null,
          redeemedVisitCount: vr.redeemedVisitCount,
          redeemedAmount: vr.redeemedAmount
        }
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

      if (!transaction) throw new Error("Transaction not found.");
      if (transaction.status === "VOIDED" || transaction.status === "CANCELLED") {
        throw new Error("Transaction is already voided or cancelled.");
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
        if (redemptions > 0) throw new Error("Cannot cancel transaction because generated vouchers have already been redeemed.");

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

