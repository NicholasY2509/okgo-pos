import { PosRedemptionRepository } from "../repositories/pos-redemption-repository";

export class PosRedemptionService {
  static async directRedeem(input: any) {
    return await PosRedemptionRepository.directRedeem(input);
  }
}
