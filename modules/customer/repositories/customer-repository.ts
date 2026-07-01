import { prisma } from "@/lib/prisma";
import { CustomerInput } from "../schemas/customer-schema";
import { Prisma } from "@/lib/generated/prisma";

export const CustomerRepository = {
  async create(data: CustomerInput) {
    return await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
      },
    });
  },

  async update(id: string, data: CustomerInput) {
    return await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
      },
    });
  },

  async getAll() {
    return await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async findManyWithFilter(whereClause: Prisma.CustomerWhereInput, skip: number, limit: number) {
    return await prisma.customer.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { name: "asc" },
    });
  },

  async count(whereClause: Prisma.CustomerWhereInput) {
    return await prisma.customer.count({
      where: whereClause,
    });
  },

  async getById(id: string) {
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
  },

  async delete(id: string) {
    return await prisma.customer.delete({
      where: { id },
    });
  }
};
