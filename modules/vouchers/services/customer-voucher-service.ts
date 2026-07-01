import { CustomerVoucherRepository } from "../repositories/customer-voucher-repository"

export class CustomerVoucherService {
  static async getAll() {
    return await CustomerVoucherRepository.getAll()
  }
  
  private static serializeVoucher(voucher: any) {
    if (!voucher) return voucher;
    return {
      ...voucher,
      initialCreditAmount: voucher.initialCreditAmount ? Number(voucher.initialCreditAmount) : null,
      remainingCreditAmount: voucher.remainingCreditAmount ? Number(voucher.remainingCreditAmount) : null,
      voucherPacket: voucher.voucherPacket ? {
        ...voucher.voucherPacket,
        price: voucher.voucherPacket.price ? Number(voucher.voucherPacket.price) : null,
        totalCreditAmount: voucher.voucherPacket.totalCreditAmount ? Number(voucher.voucherPacket.totalCreditAmount) : null,
        product: voucher.voucherPacket.product ? {
          ...voucher.voucherPacket.product,
          price: voucher.voucherPacket.product.price ? Number(voucher.voucherPacket.product.price) : null,
        } : undefined
      } : undefined
    }
  }

  static async getByCustomerId(customerId: string) {
    const vouchers = await CustomerVoucherRepository.getByCustomerId(customerId);
    return vouchers.map(v => this.serializeVoucher(v));
  }

  static async getByCode(code: string) {
    const voucher = await CustomerVoucherRepository.getByCode(code);
    return this.serializeVoucher(voucher);
  }

  static async getById(id: string) {
    return await CustomerVoucherRepository.getById(id)
  }
}
