import { BrandSettingRepository } from "../repositories/brand-setting-repository";
import { BrandSettingInput } from "../schemas/brand-setting";

export class BrandSettingService {
  static async get() {
    return await BrandSettingRepository.get();
  }

  static async update(data: BrandSettingInput) {
    return await BrandSettingRepository.upsert(data);
  }
}
