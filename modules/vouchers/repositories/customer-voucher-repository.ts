import { prisma } from "@/lib/prisma"

export const CustomerVoucherRepository = {
  async getAll() {
    return await prisma.customerVoucher.findMany({
      include: {
        customer: true,
        voucherPacket: true
      },
      orderBy: { createdAt: "desc" }
    })
  },

  async getByCustomerId(customerId: string) {
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
  },

  async getByCode(code: string) {
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
  },

  async getById(id: string) {
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
