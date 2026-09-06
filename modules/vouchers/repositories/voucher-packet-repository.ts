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
  },
  
  async generateVouchers(packetId: string, quantity: number) {
    const packet = await prisma.voucherPacket.findUnique({ where: { id: packetId } });
    if (!packet) throw new Error("Voucher packet not found");

    const vouchers = [];
    
    // Jika paket ini merupakan "Bundle" (memiliki Jumlah Kunjungan)
    // maka 1 quantity = menghasilkan banyak lembar voucher (sebanyak Jumlah Kunjungan)
    const generatePerQuantity = packet.totalVisitCount && packet.totalVisitCount > 0 ? packet.totalVisitCount : 1;
    const finalVisitCount = packet.totalVisitCount && packet.totalVisitCount > 0 ? 1 : null;

    for (let i = 0; i < quantity; i++) {
      for (let v = 0; v < generatePerQuantity; v++) {
        const code = (packet.codeSuffix || 'VCH') + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        vouchers.push({
          code,
          voucherPacketId: packet.id,
          customerId: null,
          initialVisitCount: finalVisitCount,
          remainingVisitCount: finalVisitCount,
          initialCreditAmount: packet.totalCreditAmount,
          remainingCreditAmount: packet.totalCreditAmount,
        });
      }
    }

    await prisma.customerVoucher.createMany({
      data: vouchers
    });

    return vouchers;
  }

}