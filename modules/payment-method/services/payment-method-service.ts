import { prisma } from "@/lib/prisma";
import { PaymentMethodInput } from "../schemas/payment-method-schema";

export class PaymentMethodService {
  static async create(data: PaymentMethodInput) {
    return await prisma.paymentMethod.create({
      data: {
        name: data.name,
        type: data.type,
        isActive: data.isActive,
      },
    });
  }

  static async update(id: string, data: PaymentMethodInput) {
    return await prisma.paymentMethod.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        isActive: data.isActive,
      },
    });
  }

  static async getAll() {
    return await prisma.paymentMethod.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  static async getActive() {
    return await prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  static async getById(id: string) {
    return await prisma.paymentMethod.findUnique({
      where: { id },
    });
  }

  static async delete(id: string) {
    return await prisma.paymentMethod.delete({
      where: { id },
    });
  }
}
