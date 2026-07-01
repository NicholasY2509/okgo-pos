import { PosTransactionRepository } from "../repositories/pos-transaction-repository";

export class PosTransactionService {
  static async cancelTransaction(transactionId: string) {
    return await PosTransactionRepository.cancelTransaction(transactionId);
  }
}
