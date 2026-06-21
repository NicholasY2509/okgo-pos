import { prisma } from "@/lib/prisma"
import { VoucherPacketInput } from "../schemas/voucher-packet"

export class VoucherPacketService {
  static async create(data: VoucherPacketInput) {
    const { id, ...createData } = data
    return await prisma.voucherPacket.create({
      data: createData
    })
  }

  static async update(id: string, data: VoucherPacketInput) {
    const { id: _, ...updateData } = data
    return await prisma.voucherPacket.update({
      where: { id },
      data: updateData
    })
  }

  static async delete(id: string) {
    return await prisma.voucherPacket.delete({
      where: { id }
    })
  }

  static async getByProductId(productId: string) {
    return await prisma.voucherPacket.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async getAll() {
    return await prisma.voucherPacket.findMany({
      include: {
        product: true
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}
