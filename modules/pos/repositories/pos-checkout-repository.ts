import { prisma } from "@/lib/prisma";
import { PosCheckoutInput } from "../schemas/pos-schema";
import { PosUtils } from "../services/pos-utils";

export const PosCheckoutRepository = {
  async checkout(input: PosCheckoutInput) {
    if (input.isPayLater) {
      const hasVoucherPacket = input.items.some(i => i.type === "VOUCHER_PACKET");
      if (hasVoucherPacket) {
        throw new Error("Pembelian paket voucher tidak dapat menggunakan fitur Bayar Nanti.");
      }
      if (input.payments && input.payments.length > 0) {
        input.payments = [];
      }
    }

    return await prisma.$transaction(async (tx) => {
      await this.validatePreconditions(tx, input);

      if (input.loadedTransactionId) {
        // Hapus transaksi lama beserta item dan sesinya secara cascade.
        await tx.transaction.delete({
          where: { id: input.loadedTransactionId }
        });
      }

      if (input.loadedBookingId) {
        await tx.booking.update({
          where: { id: input.loadedBookingId },
          data: { status: "PROCESSED" }
        });
      }

      const {
        subtotal,
        discountTotal,
        transactionItemsData,
        serviceSessionsData,
        customerVouchersData,
        itemVoucherRedemptionsData
      } = await this.processCartItems(tx, input);

      const totalAmount = subtotal - discountTotal;

      let paidAmount = 0;
      let changeAmount = 0;
      let transactionPaymentsData: any[] = [];
      let voucherRedemptionsData: any[] = [];

      if (!input.isPayLater) {
        const paymentRes = await this.processPayments(tx, input, totalAmount);
        paidAmount = paymentRes.paidAmount;
        changeAmount = paymentRes.changeAmount;
        transactionPaymentsData = paymentRes.transactionPaymentsData;
        voucherRedemptionsData = paymentRes.voucherRedemptionsData;
      }

      const allVoucherRedemptionsData = [...voucherRedemptionsData, ...itemVoucherRedemptionsData];

      const transaction = await tx.transaction.create({
        data: {
          branchId: input.branchId,
          customerId: input.customerId || null,
          cashierId: input.cashierId || null,
          transactionNumber: PosUtils.generateTransactionNumber(),
          subtotal,
          discountTotal,
          promotionId: input.promotionId || null,
          taxTotal: 0,
          totalAmount,
          paidAmount,
          changeAmount,
          status: input.isPayLater ? "PENDING" : "COMPLETED",
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

      // Automated Accounting
      const { JournalEntryAutomation } = require("../../accounting/services/journal-entry-automation");
      await JournalEntryAutomation.handleTransactionCompleted(tx, transaction);

      return transaction;
    });
  },

  async validatePreconditions(tx: any, input: PosCheckoutInput) {
    const branch = await tx.branch.findUnique({ where: { id: input.branchId } });
    if (!branch || !branch.isActive) {
      throw new Error("Cabang tidak valid atau tidak aktif.");
    }

    if (input.customerId) {
      const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
      if (!customer) throw new Error("Pelanggan tidak valid.");
    }
  },

  async processCartItems(tx: any, input: PosCheckoutInput) {
    let subtotal = 0;
    let discountTotal = 0;
    const transactionItemsData: any[] = [];
    const serviceSessionsData: any[] = [];
    const customerVouchersData: any[] = [];
    const itemVoucherRedemptionsData: any[] = [];



    for (const item of input.items) {
      let unitPrice = 0;
      let itemNameSnapshot = "";
      let cashierIncentiveAmount = 0;

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

        const activeSessions = await tx.serviceSession.count({
          where: { roomId: item.roomId, status: { in: ["SCHEDULED", "IN_PROGRESS"] } }
        });
        if (room.capacity !== null && (activeSessions + item.quantity) > room.capacity) {
          throw new Error(`Kapasitas ruang ${room.name} penuh.`);
        }

        const startTime = new Date();
        const endTime = product.duration ? new Date(startTime.getTime() + product.duration * 60000) : null;

        serviceSessionsData.push({
          serviceId: item.serviceId,
          staffId: item.staffId,
          roomId: item.roomId,
          branchId: input.branchId,
          customerId: input.customerId || null,
          bookingId: input.loadedBookingId || null,
          startTime,
          endTime,
          status: "SCHEDULED"
        });

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
              _tempItemIndex: transactionItemsData.length
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

        if (packet.cashierIncentiveAmount) {
          let perUnitIncentive = 0;
          if (packet.cashierIncentiveType === "PERCENTAGE") {
            perUnitIncentive = (Number(packet.cashierIncentiveAmount) / 100) * unitPrice;
          } else {
            perUnitIncentive = Number(packet.cashierIncentiveAmount);
          }
          cashierIncentiveAmount = perUnitIncentive * item.quantity;
        }

        customerVouchersData.push({
          packet,
          quantity: item.quantity
        });
      }

      let totalItemDiscount = 0;
      if (item.type === "SERVICE") {
        if (item.isVoucherRedemption) {
          totalItemDiscount = unitPrice * item.quantity;
        } else {
          totalItemDiscount = item.discountAmount || 0;
        }
      } else if (item.type === "VOUCHER_PACKET") {
        totalItemDiscount = item.discountAmount || 0;
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
        cashierIncentiveAmount,
        _tempType: item.type
      });
    }

    if (input.promotionId) {
      let isVoucherUsed = itemVoucherRedemptionsData.length > 0;
      
      // Check if any payment method is VOUCHER
      if (!isVoucherUsed && input.payments) {
        const pmIds = input.payments.map(p => p.paymentMethodId);
        const pms = await tx.paymentMethod.findMany({
          where: { id: { in: pmIds }, type: "VOUCHER" }
        });
        if (pms.length > 0) isVoucherUsed = true;
      }

      if (isVoucherUsed) {
        throw new Error("Voucher dan Diskon Promosi tidak dapat digunakan bersamaan. Voucher memiliki prioritas.");
      }

      const promo = await tx.promotion.findUnique({ where: { id: input.promotionId } });
      if (promo && promo.isActive) {
        
        // Validate schedule
        const now = new Date();
        const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
        const todayStr = days[now.getDay()];
        const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        let isTimeValid = false;
        
        if (promo.schedules && Array.isArray(promo.schedules)) {
          for (const schedule of promo.schedules as any[]) {
            if (schedule.days && schedule.days.includes(todayStr)) {
              if (schedule.startTime && schedule.endTime) {
                if (currentTimeStr >= schedule.startTime && currentTimeStr <= schedule.endTime) {
                  isTimeValid = true;
                  break;
                }
              } else {
                isTimeValid = true;
                break;
              }
            }
          }
        } else {
          // If no schedules defined, it's always active
          isTimeValid = true;
        }

        if (!isTimeValid) {
          throw new Error("Diskon promosi tidak berlaku pada waktu ini.");
        }

        // Validate conditions (minQuantity, requiredServiceIds)
        if (promo.conditions) {
          const conditions = promo.conditions as any;
          if (conditions.minQuantity && input.items.length < conditions.minQuantity) {
            throw new Error(`Promosi membutuhkan minimal ${conditions.minQuantity} item layanan.`);
          }
          if (conditions.requiredServiceIds && conditions.requiredServiceIds.length > 0) {
            const hasRequired = input.items.some(item => 
              item.type === "SERVICE" && conditions.requiredServiceIds.includes(item.serviceId)
            );
            if (!hasRequired) {
              throw new Error("Promosi ini tidak berlaku untuk layanan yang dipilih.");
            }
          }
        }

        const reward = promo.reward as any;
        if (reward.type === "PERCENTAGE_TOTAL" && reward.value) {
          discountTotal += subtotal * (reward.value / 100);
        } else if (reward.type === "FREE_ADDON" && reward.addonServiceId) {
          const product = await tx.product.findUnique({ where: { id: reward.addonServiceId } });
          if (product) discountTotal += Number(product.price);
        }
      }
    }

    return { subtotal, discountTotal, transactionItemsData, serviceSessionsData, customerVouchersData, itemVoucherRedemptionsData };
  },

  async processPayments(tx: any, input: PosCheckoutInput, totalAmount: number) {
    let paidAmount = 0;
    const transactionPaymentsData: any[] = [];
    const voucherRedemptionsData: any[] = [];

    for (const payment of input.payments || []) {
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
          // Sisa saldo voucher selalu hangus (0) setelah digunakan
          await tx.customerVoucher.update({
            where: { id: customerVoucher.id },
            data: {
              remainingCreditAmount: 0,
              status: "USED_UP"
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
  },

  async createTransactionItemsAndLink(
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
                    code: PosUtils.generateVoucherCode(packet.codeSuffix),
                    customerId: input.customerId!,
                    voucherPacketId: packet.id,
                    sourceTransactionId: transaction.id,
                    sourceTransactionItemId: createdItem.id,
                    initialVisitCount: 1,
                    remainingVisitCount: 1,
                    initialCreditAmount: packet.totalCreditAmount || null,
                    remainingCreditAmount: packet.totalCreditAmount || null,
                    status: "ACTIVE",
                    expiresAt
                  }
                });
              }
            } else {
              await tx.customerVoucher.create({
                data: {
                  code: PosUtils.generateVoucherCode(packet.codeSuffix),
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

      if (itemData.cashierIncentiveAmount > 0 && transaction.cashierId) {
        await tx.staffIncentive.create({
          data: {
            staffId: transaction.cashierId,
            amount: itemData.cashierIncentiveAmount,
            type: "CASHIER_COMMISSION",
            description: `Cashier incentive for selling voucher packet`,
            transactionItemId: createdItem.id,
          }
        });
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
};
