import { PosCheckoutInput } from "../schemas/pos-schema";
import { PosCheckoutRepository } from "../repositories/pos-checkout-repository";

export class PosCheckoutService {
  static async checkout(input: PosCheckoutInput) {
    return await PosCheckoutRepository.checkout(input);
  }
}
