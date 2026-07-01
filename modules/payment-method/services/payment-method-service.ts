import { PaymentMethodInput } from "../schemas/payment-method-schema";
import { PaymentMethodRepository } from "../repositories/payment-method-repository";

export class PaymentMethodService {
  static async create(data: PaymentMethodInput) {
      return await PaymentMethodRepository.create(data);
  }

  static async update(id: string, data: PaymentMethodInput) {
      return await PaymentMethodRepository.update(id, data);
  }

  static async getAll() {
      return await PaymentMethodRepository.getAll();
  }

  static async getActive() {
      return await PaymentMethodRepository.getActive();
  }

  static async getById(id: string) {
      return await PaymentMethodRepository.getById(id);
  }

  static async delete(id: string) {
      return await PaymentMethodRepository.delete(id);
  }
}
