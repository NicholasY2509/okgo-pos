import { prisma } from "@/lib/prisma";
import { PaymentMethodInput } from "../schemas/payment-method-schema";

export let PaymentMethodRepository = {
    create: async (data: PaymentMethodInput) => {
        return await prisma.paymentMethod.create({
          data: {
            name: data.name,
            type: data.type,
            isActive: data.isActive,
            ledgerAccountId: data.ledgerAccountId,
          },
        });
        },
    update: async (id: string, data: PaymentMethodInput) => {
        return await prisma.paymentMethod.update({
          where: { id },
          data: {
            name: data.name,
            type: data.type,
            isActive: data.isActive,
            ledgerAccountId: data.ledgerAccountId,
          },
        });
        },
    getAll: async () => {
        return await prisma.paymentMethod.findMany({
          orderBy: { createdAt: "desc" },
          include: { ledgerAccount: true }
        });
        },
    getActive: async () => {
        return await prisma.paymentMethod.findMany({
          where: { isActive: true },
          orderBy: { name: "asc" },
          include: { ledgerAccount: true }
        });
        },
    getById: async (id: string) => {
        return await prisma.paymentMethod.findUnique({
          where: { id },
          include: { ledgerAccount: true }
        });
        },
    delete: async (id: string) => {
        return await prisma.paymentMethod.delete({
          where: { id },
        });
        }
};
