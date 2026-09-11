import { StaffIncentiveRepository, GetIncentivesFilter } from "../repositories/staff-incentive-repository";

export class StaffIncentiveService {
  static async getIncentives(filter: GetIncentivesFilter) {
    return await StaffIncentiveRepository.getIncentives(filter);
  }

  static async getIncentiveSummary(filter: Omit<GetIncentivesFilter, "page" | "limit">) {
    return await StaffIncentiveRepository.getIncentiveSummary(filter);
  }
}
