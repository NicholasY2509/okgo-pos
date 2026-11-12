import { describe, it, expect, vi, beforeEach } from "vitest";
import { MarketingSettingService } from "./marketing-setting-service";
import { MarketingSettingRepository } from "../repositories/marketing-setting-repository";

vi.mock("../repositories/marketing-setting-repository", () => ({
  MarketingSettingRepository: {
    get: vi.fn(),
    upsert: vi.fn(),
  },
}));

describe("MarketingSettingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isMaintenanceMode", () => {
    it("should return false if setting does not exist in repository", async () => {
      vi.mocked(MarketingSettingRepository.get).mockResolvedValue(null);

      const result = await MarketingSettingService.isMaintenanceMode();
      expect(result).toBe(false);
    });

    it("should return true when isMaintenanceMode is true", async () => {
      vi.mocked(MarketingSettingRepository.get).mockResolvedValue({
        id: "setting-1",
        isMaintenanceMode: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await MarketingSettingService.isMaintenanceMode();
      expect(result).toBe(true);
    });

    it("should return false when isMaintenanceMode is false", async () => {
      vi.mocked(MarketingSettingRepository.get).mockResolvedValue({
        id: "setting-1",
        isMaintenanceMode: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await MarketingSettingService.isMaintenanceMode();
      expect(result).toBe(false);
    });
  });

  describe("update", () => {
    it("should delegate update to repository upsert", async () => {
      const mockResult = {
        id: "setting-1",
        isMaintenanceMode: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(MarketingSettingRepository.upsert).mockResolvedValue(mockResult);

      const result = await MarketingSettingService.update({ isMaintenanceMode: true });
      expect(MarketingSettingRepository.upsert).toHaveBeenCalledWith({ isMaintenanceMode: true });
      expect(result).toEqual(mockResult);
    });
  });
});
