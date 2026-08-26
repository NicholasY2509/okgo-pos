import { prisma } from "@/lib/prisma"

export const VoucherPacketRepository = {
  async create(createData: any) {
    const { productId, ...rest } = createData;
    const data: any = { ...rest };
    if (productId) {
      data.product = { connect: { id: productId } };
    }

    return await prisma.voucherPacket.create({
      data
    })
  },

  async update(id: string, updateData: any) {
    const { productId, ...rest } = updateData;
    const data: any = { ...rest };

    if (productId !== undefined) {
      if (productId === null) {
        data.product = { disconnect: true };
      } else {
        data.product = { connect: { id: productId } };
      }
    }

    return await prisma.voucherPacket.update({
      where: { id },
      data
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
