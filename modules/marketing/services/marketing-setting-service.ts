import { MarketingSettingRepository } from "../repositories/marketing-setting-repository";
import { MarketingSettingInput } from "../schemas/marketing-setting";

export class MarketingSettingService {
  static async get() {
    return await MarketingSettingRepository.get();
  }

  static async isMaintenanceMode(): Promise<boolean> {
    const setting = await MarketingSettingRepository.get();
    return setting?.isMaintenanceMode ?? false;
  }

  static async update(data: MarketingSettingInput) {
    return await MarketingSettingRepository.upsert(data);
  }
}
