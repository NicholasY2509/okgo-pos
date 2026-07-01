import { prisma } from "@/lib/prisma";

export const PosDataRepository = {
  async getBranchBySubdomain(subdomain: string) {
    return await prisma.branch.findUnique({
      where: { subdomain }
    });
  },

  async getActiveProducts() {
    return await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' }
    });
  },

  async getActiveVoucherPackets() {
    return await prisma.voucherPacket.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  },

  async getActiveStaff() {
    return await prisma.staff.findMany({
      where: { isActive: true },
      orderBy: { firstName: 'asc' }
    });
  },

  async getActiveRooms(branchId: string) {
    return await prisma.room.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: 'asc' }
    });
  },

  async getActivePaymentMethods() {
    return await prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  },

  async getAllCustomers() {
    return await prisma.customer.findMany({
      orderBy: { name: 'asc' }
    });
  }
};
