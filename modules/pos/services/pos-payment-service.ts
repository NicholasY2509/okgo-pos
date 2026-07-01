import { PosPaymentRepository } from "../repositories/pos-payment-repository";

export class PosPaymentService {
  static async payExistingTransaction(input: {
    transactionId: string;
    payments: {
      paymentMethodId: string;
      amount: number;
      referenceNumber?: string;
      voucherCode?: string;
      notes?: string;
    }[];
  }) {
    return await PosPaymentRepository.payExistingTransaction(input);
  }
}
