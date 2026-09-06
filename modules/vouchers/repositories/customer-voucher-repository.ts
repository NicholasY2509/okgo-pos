import { prisma } from "@/lib/prisma"

export const CustomerVoucherRepository = {
  
  async getPaginated(params: {
    page: number;
    limit: number;
    status?: string;
    type?: string;
    productId?: string;
  }) {
    const { page, limit, status, type, productId } = params;
    
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    
    // type = NOMINAL or VISIT
    if (type === 'NOMINAL') {
      where.initialCreditAmount = { not: null };
    } else if (type === 'VISIT') {
      where.initialVisitCount = { not: null };
    }
    
    if (productId && productId !== 'ALL') {
      if (productId === 'NONE') {
        where.voucherPacket = { productId: null };
      } else {
        where.voucherPacket = { productId };
      }
    }

    const [data, total] = await Promise.all([
      prisma.customerVoucher.findMany({
        where,
        include: {
          customer: true,
          voucherPacket: {
            include: { product: true }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customerVoucher.count({ where })
    ]);

    return {
      data,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

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
