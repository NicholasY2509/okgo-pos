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
