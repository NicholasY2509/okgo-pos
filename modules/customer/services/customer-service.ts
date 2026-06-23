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
