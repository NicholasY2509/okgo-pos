import { prisma } from "@/lib/prisma"

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
        select: { id: true }
      });

      if (expiredVouchers.length === 0) {
        return { count: 0, recognizedValue: 0 };
      }

      // 1. Update Voucher Status to EXPIRED
      await tx.customerVoucher.updateMany({
        where: { id: { in: expiredVouchers.map(v => v.id) } },
        data: { status: "EXPIRED" }
      });

      // Under direct revenue recognition (ADR-0003), revenue was already 100% recognized
      // at the time of voucher purchase (Account 413). Therefore, no secondary breakage
      // journal entry (Debit 214 / Credit 412) is generated upon expiry.
      return { count: expiredVouchers.length, recognizedValue: 0 };
    });
  }
}
