import { StaffIncentiveRepository, GetIncentivesFilter } from "../repositories/staff-incentive-repository";

export class StaffIncentiveService {
  static async getIncentives(filter: GetIncentivesFilter) {
    return await StaffIncentiveRepository.getIncentives(filter);
  }
}
