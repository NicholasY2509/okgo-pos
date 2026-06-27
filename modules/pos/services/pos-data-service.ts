import { prisma } from "@/lib/prisma";
import { DiscountService } from "../../discount/services/discount-service";

export class PosDataService {
  static async getInitialData(tenant: string) {
    const branch = await prisma.branch.findUnique({
      where: { subdomain: tenant }
    });

    if (!branch) {
      return null;
    }

    const activeDiscount = await DiscountService.getApplicableDiscount(branch.id);

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' }
    });

    const voucherPackets = await prisma.voucherPacket.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    const staff = await prisma.staff.findMany({
      where: { isActive: true },
      orderBy: { firstName: 'asc' }
    });

    const rooms = await prisma.room.findMany({
      where: { branchId: branch.id, isActive: true },
      orderBy: { name: 'asc' }
    });

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' }
    });

    // Convert Prisma Decimal objects to primitive numbers for Client Components
    const serializedProducts = products.map(p => ({
      ...p,
      price: p.price ? Number(p.price) : 0,
    }));

    const serializedVoucherPackets = voucherPackets.map(vp => ({
      ...vp,
      price: vp.price ? Number(vp.price) : 0,
      totalCreditAmount: vp.totalCreditAmount ? Number(vp.totalCreditAmount) : null,
    }));

    return {
      branch,
      products: serializedProducts,
      voucherPackets: serializedVoucherPackets,
      staff,
      rooms,
      paymentMethods,
      customers,
      activeDiscount
    };
  }
}
