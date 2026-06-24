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
  static async getByCustomerId(customerId: string) {
    return await prisma.customerVoucher.findMany({
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
    })
  }

  static async getByCode(code: string) {
    return await prisma.customerVoucher.findUnique({
      where: { code },
      include: {
        customer: true,
        voucherPacket: {
          include: {
            product: true
          }
        }
      }
    })
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
