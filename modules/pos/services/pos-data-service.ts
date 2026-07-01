import { DiscountService } from "../../discount/services/discount-service";
import { PosDataRepository } from "../repositories/pos-data-repository";

export class PosDataService {
  static async getInitialData(tenant: string) {
    const branch = await PosDataRepository.getBranchBySubdomain(tenant);

    if (!branch) {
      return null;
    }

    const activeDiscount = await DiscountService.getApplicableDiscount(branch.id);

    const products = await PosDataRepository.getActiveProducts();

    const voucherPackets = await PosDataRepository.getActiveVoucherPackets();

    const staff = await PosDataRepository.getActiveStaff();

    const rooms = await PosDataRepository.getActiveRooms(branch.id);

    const paymentMethods = await PosDataRepository.getActivePaymentMethods();

    const customers = await PosDataRepository.getAllCustomers();

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
