import { prisma } from "@/lib/prisma"

export const VoucherPacketRepository = {
  async create(createData: any) {
    return await prisma.voucherPacket.create({
      data: createData
    })
  },

  async update(id: string, updateData: any) {
    return await prisma.voucherPacket.update({
      where: { id },
      data: updateData
    })
  },

  async delete(id: string) {
    return await prisma.voucherPacket.delete({
      where: { id }
    })
  },

  async getByProductId(productId: string) {
    return await prisma.voucherPacket.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    })
  },

  async getAll() {
    return await prisma.voucherPacket.findMany({
      include: {
        product: true
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}
