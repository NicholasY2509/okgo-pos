import { prisma } from "@/lib/prisma";
import { CustomerInput } from "../schemas/customer-schema";

export class CustomerService {
  static async create(data: CustomerInput) {
    return await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
      },
    });
  }

  static async update(id: string, data: CustomerInput) {
    return await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
      },
    });
  }

  static async getAll() {
    return await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  static async searchCustomers(query: string = "", page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const whereClause = query
      ? {
          OR: [
            { name: { contains: query } },
            { phone: { contains: query } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.customer.count({
        where: whereClause,
      }),
    ]);

    return {
      data,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  static async getById(id: string) {
    return await prisma.customer.findUnique({
      where: { id },
      include: {
        vouchers: {
          include: {
            voucherPacket: true
          }
        },
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  static async delete(id: string) {
    return await prisma.customer.delete({
      where: { id },
    });
  }
}
