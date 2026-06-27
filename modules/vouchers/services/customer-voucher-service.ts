import { prisma } from "@/lib/prisma"

export class CustomerVoucherService {
  static async getAll() {
    return await prisma.customerVoucher.findMany({
      include: {
        customer: true,
        voucherPacket: true
      },
      orderBy: { createdAt: "desc" }
    })
  }
  private static serializeVoucher(voucher: any) {
    if (!voucher) return voucher;
    return {
      ...voucher,
      initialCreditAmount: voucher.initialCreditAmount ? Number(voucher.initialCreditAmount) : null,
      remainingCreditAmount: voucher.remainingCreditAmount ? Number(voucher.remainingCreditAmount) : null,
      voucherPacket: voucher.voucherPacket ? {
        ...voucher.voucherPacket,
        price: voucher.voucherPacket.price ? Number(voucher.voucherPacket.price) : null,
        totalCreditAmount: voucher.voucherPacket.totalCreditAmount ? Number(voucher.voucherPacket.totalCreditAmount) : null,
        product: voucher.voucherPacket.product ? {
          ...voucher.voucherPacket.product,
          price: voucher.voucherPacket.product.price ? Number(voucher.voucherPacket.product.price) : null,
        } : undefined
      } : undefined
    }
  }

  static async getByCustomerId(customerId: string) {
    const vouchers = await prisma.customerVoucher.findMany({
      where: {
        customerId,
        status: "ACTIVE"
      },
      include: {
        voucherPacket: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return vouchers.map(v => this.serializeVoucher(v));
  }

  static async getByCode(code: string) {
    const voucher = await prisma.customerVoucher.findUnique({
      where: { code },
      include: {
        customer: true,
        voucherPacket: {
          include: {
            product: true
          }
        }
      }
    });
    return this.serializeVoucher(voucher);
  }

  static async getById(id: string) {
    return await prisma.customerVoucher.findUnique({
      where: { id },
      include: {
        customer: true,
        voucherPacket: true,
        redemptions: {
          include: {
            transaction: true
          }
        }
      }
    })
  }
}
